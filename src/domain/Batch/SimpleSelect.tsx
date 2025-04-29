import {
	Bold,
	Button,
	Divider,
	IconBooleanSmall24,
	IconButton,
	IconCloseSmall24,
	Muted,
	VerticalSpace,
} from '@create-figma-plugin/ui';
import { Fragment, h } from 'preact';
import { MetaData, searchStore } from '../Search/searchStore';
import { emit } from '@create-figma-plugin/utilities';
import { GET_PATTERN_MATCH_KEY, UPDATE_BASE_NODE } from '../constant';
import {
	autoCurrentNodesSignal,
	autoCurrentNodeStyleSignal,
	currentPointerSignal,
	currentSectionSignal,
	inputKeySignal,
	patternMatchDataSignal,
	searchStoreLocationSignal,
	selectedKeySignal,
	selectIdsSignal,
} from '@/model/signal';
import { useSignal } from '@/hooks/useSignal';
import { SearchArea, useSearch } from '../Label/LabelSearch';
import { useEffect, useState } from 'preact/hooks';
import { onPatternMatchResponse } from './batchModel';
import { signal } from '@preact/signals-core';
import styles from './SimpleSelect.module.css';
import { clc } from '@/components/modal/utils';
import { TargetedEvent } from 'preact/compat';
import { pageNodeZoomAction } from '@/figmaPluginUtils/utilAction';
import { SearchNodeData } from '@/model/types';
import { clientFetchDBCurry } from '../utils/fetchDB';
import { isHideNode } from '../Search/visualModel';
import { notify } from '@/figmaPluginUtils';

type Props = {
	id: string;
	selected: boolean;
	keyMatch: boolean;
	current: boolean;
	hide: boolean;
	isNext: boolean;
	baseNodeId?: string;
	pageId?: string;
	projectId?: string;
};

export const nextBaseSignal = signal<{
	baseNodeId: string;
	nodeId: string;
	pageId: string;
	projectId: string;
}>({
	baseNodeId: '',
	nodeId: '',
	pageId: '',
	projectId: '',
});

const KeyIdNameSignal = signal<Record<string, string>>({});

const clientFetch = clientFetchDBCurry();

const updateKeyIds = async (keyIds: string[]) => {
	const oldKeyNames = KeyIdNameSignal.value;

	const data = await clientFetch('/localization/keys/names-by-ids', {
		method: 'POST',
		body: JSON.stringify({
			ids: keyIds,
		}),
	});

	const newKeyNames = (await data.json()) as Record<string, string>;

	KeyIdNameSignal.value = { ...oldKeyNames, ...newKeyNames };
};

/**
 * 단일 키 기준으로 변경할 선택지들을 제공하고
 * 입력으로 추가하거나
 * 추천 받은 것에서 선택하거나
 * 새로운 공간에서 새로운 key를 새로 부여해야할 때 문제가 있음
 * 의미적으로 완전히 같은데 피그마에서 완전히 새로 생겨났을 때 완전히 새로운 키로 생성되는 문제 임
 * 이는 검색을 통해 똑같은 텍스트가 있으면 그 키를 추가하는 식으로 동기화하는 방법이 있긴 함
 * 섹션이 없으면 그다지 유효하지 않음
 * 섹션이 있으면 충분히 유효함
 * 키에는 기존에 포함된 로케이션 키 이름이 있을 수 있음
 *
 */
const KeyIds = ({
	keyIds,
	selectKey,
	searchHandler,
}: {
	keyIds: string[];
	selectKey: string | null;
	searchHandler: (key: string) => void;
}) => {
	// 로컬라이제이션 키에 저장 된 이름들
	//
	const keyNameStore = useSignal(KeyIdNameSignal);
	const patternMatchData = useSignal(patternMatchDataSignal);
	const selectIds = useSignal(selectIdsSignal);

	const keyName = keyIds.map((id) => {
		return [id, keyNameStore[id]];
	});

	useEffect(() => {
		const nullKeyIds = keyName.filter((item) => item[1] == null).map((item) => item[0]);
		if (nullKeyIds.length > 0) {
			updateKeyIds(nullKeyIds);
		}
	}, [keyIds]);

	return (
		<div className={styles.keyIds}>
			{keyName.map(([id, name]) => {
				const list = patternMatchData.filter((item) => item.localizationKey === id).map((item) => item.id);
				return (
					<button
						className={clc(styles.keyId, selectKey === id && styles.keyMatch)}
						onClick={() => {
							if (selectedKeySignal.value === id) {
								selectedKeySignal.value = null;
								searchHandler('');
							} else {
								selectedKeySignal.value = id;
								searchHandler(name);
							}
						}}
						// 원래 기능은 다중 선택 기능이였으나 이름 추천 후 선택 변경 , 및 저장으로 대체하려 함

						onContextMenu={(e: TargetedEvent<HTMLButtonElement, MouseEvent>) => {
							e.preventDefault(); // 기본 우클릭 메뉴 방지
							if (selectIds.some((item) => list.includes(item))) {
								const newList = new Set(selectIds.filter((item) => !list.includes(item)));
								selectIdsSignal.value = Array.from(newList);
							} else {
								const newList = new Set([...selectIds, ...list]);
								selectIdsSignal.value = Array.from(newList);
							}
						}}
					>
						#{id} : {name}
					</button>
				);
			})}
		</div>
	);
};

const Test = ({ id, selected, keyMatch, current, hide, isNext, baseNodeId, pageId, projectId }: Props) => {
	const badRequestPrams = !baseNodeId || !pageId || !projectId;

	return (
		<button
			onClick={() => {
				pageNodeZoomAction(id, false);
			}}
			onContextMenu={(e: TargetedEvent<HTMLButtonElement, MouseEvent>) => {
				e.preventDefault(); // 기본 우클릭 메뉴 방지
				if (badRequestPrams) {
					notify('잘못된 파라미터 입니다.', 'OK');
					return;
				}
				nextBaseSignal.value = {
					baseNodeId,
					nodeId: id,
					pageId,
					projectId,
				};
			}}
			className={clc(styles.outline, current && styles.current, isNext && styles.next)}
		>
			<div
				className={clc(styles.inline, keyMatch && styles.keyMatch, selected && styles.selected, hide && styles.hide)}
			></div>
		</button>
	);
};

export const ignoreSectionIdsSignal = signal<string[]>([]);

function SimpleSelect() {
	/** 선택된 전체 아이디 */
	const selectItems = useSignal(selectIdsSignal);
	/** 베이스 키 마케팅 운용 */
	const selectKey = useSignal(selectedKeySignal);
	/** 검색된 키 : 벨류 */
	const patternMatchData = useSignal(patternMatchDataSignal);
	/** 로케이션 키: 벨류 */
	const searchStoreLocation = useSignal(searchStoreLocationSignal);
	const nextBase = useSignal(nextBaseSignal);

	const { baseNodeId, nodeId, pageId, projectId } = nextBase;

	const batchId = useSignal(autoCurrentNodeStyleSignal);

	const details = useSignal(autoCurrentNodesSignal);
	const currentNode = useSignal(currentPointerSignal);

	/** 제어할 수 있게 해야해서 합쳐야 함 */
	// const allSectionIds = new Set([...sectionIds, ...ignoreSectionIds]);

	const selectNodes = patternMatchData.filter((item) => selectItems.includes(item.id));

	const target = patternMatchData.find((item) => item.baseNodeId === batchId);

	/** 로컬라이제이션 키 기준으로
	 * 전체 선택 흭득
	 * */
	const baseNodes = patternMatchData.reduce((acc, item) => {
		const baseX = searchStoreLocation.get(item.baseNodeId ?? '');

		if (baseX && item.id === String(baseX.node_id)) {
			if (acc.has(item.localizationKey)) {
				console.log('🚀 ~ patternMatchData.reduce ~ item: 있을 수 없는 데이터', item);
			}
			acc.set(item.localizationKey, item);
		}
		return acc;
	}, new Map<string, MetaData>());
	// baseId에서 값 얻어서 baseNodes 에 들어갈 item을 선별함

	/** 전체 로컬라이제이션 키 종류 */
	const selectKeys = new Set(selectNodes.map((item) => item.localizationKey));
	console.log('🚀 ~ SimpleSelect ~ selectKeys:', selectKeys);

	/** 키 종류로 분리 */
	const keyLayer = selectNodes.reduce((acc, item) => {
		if (acc.has(item.localizationKey)) {
			acc.get(item.localizationKey)?.add(item.id);
		} else {
			acc.set(item.localizationKey, new Set([item.id]));
		}
		return acc;
	}, new Map<string, Set<string>>());

	const keyObject = patternMatchData.reduce((acc, item) => {
		if (acc.has(item.localizationKey)) {
			acc.get(item.localizationKey)?.add(item);
		} else {
			acc.set(item.localizationKey, new Set([item]));
		}
		return acc;
	}, new Map<string, Set<MetaData>>());
	console.log('🚀 ~ keyObject ~ keyObject:', keyObject);

	/**
	 * 키 뽑아서 타겟 키에 제공
	 *  */
	const targetBase = target?.baseNodeId;
	const targetKey = target?.localizationKey;

	return (
		<div className={styles.root}>
			{Array.from(selectKeys).map((key) => {
				// 선택 기준 노드 데이터
				const baseNodeMetaData = baseNodes.get(key);

				// 선택 기준의 베이스 아이디 흭득
				// 근데 그걸 검색 된 데이터에서 얻는다
				const baseX = searchStoreLocation.get(baseNodeMetaData?.baseNodeId ?? '');
				const baseId = baseX?.node_id;
				// 타겟 키 조건 확인
				const batchSum = targetKey === key;
				const batchText = batchSum ? '' : ` => ${targetKey}`;

				const baseNodeText = baseNodeMetaData?.text ?? '';

				return (
					<Fragment key={key}>
						<Muted>#{key + batchText} </Muted>
						<Bold>{baseNodeText}</Bold>
						<div className={styles.container}>
							{Array.from(keyObject.get(key) ?? []).map((item, _, arr) => {
								const selected = selectItems.includes(item.id);

								const keyMatch = selectKey === item.localizationKey;
								const current = baseId === item.id;
								const isHide = isHideNode(item);
								// const current = currentId === item.id;
								const isNext = item.id === nodeId;
								return (
									<Test
										id={item.id}
										selected={selected}
										keyMatch={keyMatch}
										current={current}
										hide={isHide}
										isNext={isNext}
										baseNodeId={String(targetBase)}
										pageId={currentNode?.pageId}
										projectId={currentNode?.projectId}
									/>
								);
							})}
						</div>

						{/* 키 리스트 */}
						{/* <KeyIds keyIds={keyIds} selectKey={selectKey} searchHandler={searchHandler} /> */}
					</Fragment>
				);
			})}
		</div>
	);
}
export default SimpleSelect;
