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
				pageNodeZoomAction(id);
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

const selectKeySignal = signal<string>('');
const selectTextSignal = signal<string>('');

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

function SimpleSelect({ searchHandler }: { searchHandler: (key: string) => void }) {
	const currentPointer = useSignal(currentPointerSignal);
	const currentSection = useSignal(currentSectionSignal);
	const selectItems = useSignal(selectIdsSignal);

	const selectKey = useSignal(selectedKeySignal);

	const patternMatchData = useSignal(patternMatchDataSignal);
	const ignoreSectionIds = useSignal(ignoreSectionIdsSignal);
	const characters = currentPointer?.characters;
	const textFilter = patternMatchData.filter((item) => {
		if (ignoreSectionIds.includes(item.root)) return false;
		return item.text === characters;
	});
	const missingLinks = selectItems.filter((item) => !textFilter.some((text) => text.id === item));
	const missingData = patternMatchData.filter((item) => missingLinks.includes(item.id));
	const currentId = currentPointer?.nodeId;
	const sectionIds = textFilter.map((item) => item.root);
	/** 제어할 수 있게 해야해서 합쳐야 함 */
	const allSectionIds = new Set([...sectionIds, ...ignoreSectionIds]);

	/** 키 여부로 분리 */
	const [otherGroup, keyGroup] = textFilter.reduce(
		(acc, item) => {
			if (item.localizationKey === '') {
				acc[0].push(item);
			} else {
				acc[1].push(item);
			}
			return acc;
		},
		[[], []] as MetaData[][]
	);

	/** 키 종류로 분리 */
	const keyLayer = keyGroup.reduce((acc, item) => {
		if (acc.has(item.localizationKey)) {
			acc.get(item.localizationKey)?.push(item.id);
		} else {
			acc.set(item.localizationKey, [item.id]);
		}
		return acc;
	}, new Map<string, string[]>());

	const keyIds = Array.from(keyLayer.keys());

	// 페이지는 생략
	const allSectionIdsArray = Array.from(allSectionIds).filter((item) => item !== currentPointer?.pageId);

	return (
		<div className={styles.root}>
			{/* 제외 리스트 */}

			{allSectionIdsArray.length > 0 && (
				<Fragment>
					<Muted>Section</Muted>
					<div className={styles.container}>
						{allSectionIdsArray
							.sort((a, b) => {
								return a.localeCompare(b);
							})
							.map((item) => {
								const selected = ignoreSectionIds.includes(item);
								return (
									<button
										className={clc(
											styles.ignoreButton,
											!selected && styles.active,
											currentSection?.id === item && styles.currentSection
										)}
										onClick={() => {
											pageNodeZoomAction(item, false);
										}}
										onContextMenu={(e: TargetedEvent<HTMLButtonElement, MouseEvent>) => {
											e.preventDefault(); // 기본 우클릭 메뉴 방지
											if (ignoreSectionIds.includes(item)) {
												ignoreSectionIdsSignal.value = ignoreSectionIds.filter((id) => id !== item);
											} else {
												ignoreSectionIdsSignal.value = [...ignoreSectionIds, item];
											}
										}}
									>
										{item}
									</button>
								);
							})}
					</div>
				</Fragment>
			)}

			{keyIds.length > 0 && (
				<Fragment>
					<Muted>Keys</Muted>
					{/* 키 있는 매칭 리스트 */}
					<div className={styles.container}>
						{keyGroup.map((item) => {
							const selected = selectItems.includes(item.id);
							const keyMatch = selectKey === item.localizationKey;
							const current = currentId === item.id;
							return <Test id={item.id} selected={selected} keyMatch={keyMatch} current={current} />;
						})}
					</div>

					{/* 키 리스트 */}
					<KeyIds keyIds={keyIds} selectKey={selectKey} searchHandler={searchHandler} />
				</Fragment>
			)}
			{otherGroup.length > 0 && (
				<Fragment>
					<div className={styles.row}>
						<Muted>Other</Muted>

						<IconButton
							onClick={() => {
								const otherIds = otherGroup.map((item) => item.id);
								if (otherIds.some((item) => selectItems.includes(item))) {
									// 있으면 제거 없으면 추가
									selectIdsSignal.value = selectItems.filter((item) => !otherIds.includes(item));
								} else {
									// 없으면 추가
									selectIdsSignal.value = [...selectItems, ...otherIds];
								}
							}}
						>
							<IconBooleanSmall24 />
						</IconButton>
					</div>

					{/* 키 없는 매칭 리스트 */}
					<div className={styles.container}>
						{otherGroup.map((item) => {
							const selected = selectItems.includes(item.id);
							const keyMatch = selectKey === item.localizationKey;
							const current = currentId === item.id;
							return <Test id={item.id} selected={selected} keyMatch={keyMatch} current={current} />;
						})}
					</div>
				</Fragment>
			)}
			{missingData.length > 0 && (
				<Fragment>
					<div className={styles.row}>
						<Muted>Selected</Muted>
						<IconButton
							onClick={() => {
								selectIdsSignal.value = selectItems.filter((item) => !missingLinks.includes(item));
							}}
						>
							<IconCloseSmall24 />
						</IconButton>
					</div>

					{/* 키 없는 매칭 리스트 */}
					<div className={styles.container}>
						{missingData.map((item) => {
							const selected = selectItems.includes(item.id);
							const keyMatch = selectKey === item.localizationKey;
							const current = currentId === item.id;
							return <Test id={item.id} selected={selected} keyMatch={keyMatch} current={current} />;
						})}
					</div>
				</Fragment>
			)}
		</div>
	);
}
export default SimpleSelect;
