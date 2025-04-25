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
import { GET_PATTERN_MATCH_KEY } from '../constant';
import {
	autoCurrentNodesSignal,
	autoCurrentNodeStyleSignal,
	currentPointerSignal,
	currentSectionSignal,
	inputKeySignal,
	patternMatchDataSignal,
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

type Props = {
	id: string;
	selected: boolean;
	keyMatch: boolean;
	current: boolean;
};

const Test = ({ id, selected, keyMatch, current }: Props) => {
	return (
		<button
			onClick={() => {
				pageNodeZoomAction(id, false);
			}}
			onContextMenu={(e: TargetedEvent<HTMLButtonElement, MouseEvent>) => {
				e.preventDefault(); // 기본 우클릭 메뉴 방지
				if (selectIdsSignal.value.includes(id)) {
					selectIdsSignal.value = selectIdsSignal.value.filter((item) => item !== id);
				} else {
					selectIdsSignal.value = [...selectIdsSignal.value, id];
				}
			}}
			className={clc(styles.outline, current && styles.current)}
		>
			<div className={clc(styles.inline, keyMatch && styles.keyMatch, selected && styles.selected)}></div>
		</button>
	);
};

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

/** 키 아이디 만 가져가게 할 건가... 전체 선택 되게 할 건가 */
const KeyIds = ({
	keyIds,
	selectKey,
	searchHandler,
}: {
	keyIds: string[];
	selectKey: string | null;
	searchHandler: (key: string) => void;
}) => {
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

export const ignoreSectionIdsSignal = signal<string[]>([]);

function SimpleSelect() {
	const selectItems = useSignal(selectIdsSignal);
	const selectKey = useSignal(selectedKeySignal);

	const patternMatchData = useSignal(patternMatchDataSignal);

	const batchId = useSignal(autoCurrentNodeStyleSignal);
	console.log('🚀 ~ SimpleSelect ~ batchId:', batchId);

	const details = useSignal(autoCurrentNodesSignal);

	/** 제어할 수 있게 해야해서 합쳐야 함 */
	// const allSectionIds = new Set([...sectionIds, ...ignoreSectionIds]);

	const selectNodes = patternMatchData.filter((item) => selectItems.includes(item.id));

	const target = patternMatchData.find((item) => item.id === batchId);

	const baseNodes = patternMatchData.reduce((acc, item) => {
		if (item.baseNodeId === item.id) {
			if (acc.has(item.localizationKey)) {
				console.log('🚀 ~ patternMatchData.reduce ~ item: 있을 수 없는 데이터', item);
			}
			acc.set(item.localizationKey, item);
		}
		return acc;
	}, new Map<string, MetaData>());

	const selectKeys = new Set(selectNodes.map((item) => item.localizationKey));

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

	const keyIds = Array.from(keyLayer.keys());
	// 키 뽑아서 타겟 키에 제공
	const targetKey = target?.localizationKey;

	return (
		<div className={styles.root}>
			{Array.from(selectKeys).map((key) => {
				const baseNodeMetaData = baseNodes.get(key);

				const batchSum = targetKey === key;
				const batchText = batchSum ? '' : ` => ${targetKey}`;

				return (
					<Fragment key={key}>
						<Muted>#{key + batchText} </Muted>
						<Bold>{baseNodeMetaData?.text}</Bold>
						<div className={styles.container}>
							{Array.from(keyObject.get(key) ?? []).map((item) => {
								const selected = selectItems.includes(item.id);
								const keyMatch = selectKey === item.localizationKey;

								const current = item.baseNodeId === item.id;
								// const current = currentId === item.id;
								return <Test id={item.id} selected={selected} keyMatch={keyMatch} current={current} />;
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
