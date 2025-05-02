import { Bold, Muted } from '@create-figma-plugin/ui';
import { Fragment, h } from 'preact';
import { MetaData } from '../Search/searchStore';

import {
	autoCurrentNodesSignal,
	autoCurrentNodeStyleSignal,
	currentPointerSignal,
	patternMatchDataSignal,
	searchStoreLocationSignal,
	selectedKeySignal,
	selectIdsSignal,
} from '@/model/signal';
import { useSignal } from '@/hooks/useSignal';

import { signal } from '@preact/signals-core';
import styles from './SimpleSelect.module.css';
import { clc } from '@/components/modal/utils';
import { TargetedEvent } from 'preact/compat';
import { pageNodeZoomAction, selectIdsAction, selectIdsToBoxAction } from '@/figmaPluginUtils/utilAction';

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

/** basenode로 등록할 때 */
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

const Test = ({ id, selected, keyMatch, current, hide, isNext, baseNodeId, pageId, projectId }: Props) => {
	const badRequestPrams = !baseNodeId || !pageId || !projectId;

	return (
		<button
			onClick={(e) => {
				// 화면만 움직여서 문제 없었던거임
				const shiftKey = e.shiftKey;
				if (shiftKey) {
					pageNodeZoomAction(id, true);
				} else {
					pageNodeZoomAction(id, false);
				}
			}}
			onContextMenu={(e: TargetedEvent<HTMLButtonElement, MouseEvent>) => {
				e.preventDefault(); // 기본 우클릭 메뉴 방지
				if (badRequestPrams) {
					notify('잘못된 파라미터 입니다.', 'OK');
					return;
				}
				const shiftKey = e.shiftKey;

				if (shiftKey) {
					// 무조건 선택도 추가
					selectIdsSignal.value = [...selectIdsSignal.value, id];

					nextBaseSignal.value = {
						baseNodeId,
						nodeId: id,
						pageId,
						projectId,
					};
				} else {
					if (selectIdsSignal.value.includes(id)) {
						// 선택해제 했으면 선택을 바꾸는 걸 추천,
						selectIdsSignal.value = selectIdsSignal.value.filter((item) => item !== id);
					} else {
						selectIdsSignal.value = [...selectIdsSignal.value, id];
					}
					selectIdsToBoxAction(selectIdsSignal.value, true);
				}
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
	console.log('🚀 ~ SimpleSelect ~ selectNodes:', selectNodes);

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
