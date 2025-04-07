import { useSignal } from '@/hooks/useSignal';
import { Fragment, h } from 'preact';
import { CurrentNode } from '@/model/types';
import { currentSectionSignal, inputKeySignal } from '@/model/signal';
import { Dispatch, StateUpdater, useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import {
	Bold,
	Button,
	Code,
	Divider,
	Dropdown,
	IconAdjustSmall24,
	IconButton,
	IconChevronDown24,
	IconChevronUp24,
	IconCloseSmall24,
	IconSwapSmall24,
	IconPrototyping24,
	IconToggleButton,
	IconHiddenSmall24,
	IconVisible16,
	Muted,
	SearchTextbox,
	Stack,
	Tabs,
	TabsOption,
	Text,
	Textbox,
	Toggle,
	VerticalSpace,
} from '@create-figma-plugin/ui';
import { emit } from '@create-figma-plugin/utilities';
import {
	GET_LOCALIZATION_KEY_VALUE,
	GET_PATTERN_MATCH_KEY,
	SET_NODE_IGNORE,
	SET_NODE_LOCALIZATION_KEY_BATCH,
	UPDATE_NODE_LOCALIZATION_KEY_BATCH,
} from '../constant';
import { groupByPattern } from './batchModel';
import { GroupOption, ViewOption } from '@/model/types';
import { PatternMatchData, SearchNodeData } from '@/model/types';
import { patternMatchDataSignal, selectIdsSignal, selectTargetSignal } from '@/model/signal';
import styles from './batch.module.css';
import { clc } from '@/components/modal/utils';
import { pageNodeZoomAction } from '@/figmaPluginUtils/utilAction';
import { clientFetchDBCurry } from '../utils/fetchDB';
import { domainSettingSignal } from '@/model/signal';
import { useFetch } from '@/hooks/useFetch';
import { modalAlert } from '@/components/alert';
import { LocalizationKeyDTO } from '@/model/types';
import { SearchArea, useSearch } from '../Label/LabelSearch';
import { selectedKeySignal } from '@/model/signal';
import { NonNullableComponentTypeExtract } from 'types/utilType';
import { keyConventionRegex } from '@/utils/textTools';
import { currentPointerSignal } from '@/model/signal';
import { TargetedEvent } from 'preact/compat';
import SimpleSelect from './SimpleSelect';
import { getTimeAgo } from '@/utils/time';

const selectStyle = (selected: boolean) => {
	if (selected) {
		return {
			secondary: false,
		};
	}

	return {
		secondary: true,
	};
};

export const SearchResult = ({ ignore, name, text, parentName, localizationKey, ids }: PatternMatchData) => {
	const [isExtended, setIsExtended] = useState<boolean>(false);
	const selectTarget = useSignal(selectTargetSignal);

	const selectIds = useSignal(selectIdsSignal);
	const hasAnyId = ids.some((id) => selectIds.includes(id));
	return (
		<div className={clc(styles.container, hasAnyId && styles.containerSelected)}>
			<div className={styles.column}>
				<div className={styles.row}>
					<IconButton
						onClick={() => {
							emit(SET_NODE_IGNORE.REQUEST_KEY, {
								ignore: !ignore,
								ids: ids,
							});
							emit(GET_PATTERN_MATCH_KEY.REQUEST_KEY, selectTarget?.id);
						}}
					>
						{ignore ? <IconHiddenSmall24 /> : <IconVisible16 />}
					</IconButton>
					<Text align="left" className={styles.width}>
						<Code>text: {text}</Code>
					</Text>

					<IconButton
						onClick={() => {
							setIsExtended(true);
							// ids 리스트 중 하나라도 현재 선택된 리스트에 있는지 확인

							if (hasAnyId) {
								// 하나라도 있으면 해당 ids 리스트의 모든 항목 제거
								selectIdsSignal.value = selectIds.filter((id) => !ids.includes(id));
							} else {
								// 하나도 없으면 모든 항목 추가
								selectIdsSignal.value = [...selectIds, ...ids];
							}
						}}
					>
						{hasAnyId ? <IconCloseSmall24 /> : ids.length.toString()}
					</IconButton>
				</div>
				<div className={styles.row}>
					<Bold className={clc(localizationKey === '' && styles.disabled)}>
						key: {localizationKey === '' ? 'NULL' : localizationKey}
					</Bold>
					<IconButton
						onClick={() => {
							setIsExtended(!isExtended);
						}}
					>
						{isExtended ? <IconChevronUp24 /> : <IconChevronDown24 />}
					</IconButton>
				</div>
			</div>
			<div className={clc(!isExtended && styles.rowExtended)}>
				<button
					className={styles.button}
					onClick={() => {
						selectIdsSignal.value = ids;
						emit('PAGE_SELECT_IDS', { ids });
					}}
				>
					{parentName} / {name}
				</button>

				<div className={styles.wrap}>
					{ids.map((item) => {
						const selected = selectIds.includes(item);

						return (
							<Button
								{...selectStyle(selected)}
								onClick={() => {
									pageNodeZoomAction(item);
								}}
								onContextMenu={(e: TargetedEvent<HTMLButtonElement, MouseEvent>) => {
									e.preventDefault(); // 기본 우클릭 메뉴 방지
									// 아이템이 이미 선택 목록에 있으면 제거하고, 없으면 추가합니다
									if (selectIds.includes(item)) {
										selectIdsSignal.value = selectIds.filter((id) => id !== item);
									} else {
										selectIdsSignal.value = [...selectIds, item];
									}
								}}
							>
								{item}
							</Button>
						);
					})}
				</div>
			</div>
		</div>
	);
};

type SearchOption = 'text' | 'localizationKey' | 'parentName' | 'name';

const optionAlias = {
	text: '텍스트',
	localizationKey: '키 값',
	parentName: '부모 이름',
	name: '이름',
	ignore: '숨김 대상',
	notIgnore: '표시 대상',
	hasLocalizationKey: '키 값 있음',
	notHasLocalizationKey: '키 값 없음',
};

// SearchSection 컴포넌트를 별도로 분리
const SearchSection = ({
	searchOption,
	setSearchOption,
	searchValue,
	setSearchValue,
	openOption,
	setOpenOption,

	groupOption,
	setGroupOption,
	viewOption,
	setViewOption,
	allView,
	setAllView,
	patternMatchDataGroup,
	filteredDataLength,
}: {
	searchOption: SearchOption;
	setSearchOption: Dispatch<StateUpdater<SearchOption>>;
	searchValue: string;
	setSearchValue: Dispatch<StateUpdater<string>>;
	openOption: boolean;
	setOpenOption: Dispatch<StateUpdater<boolean>>;

	groupOption: GroupOption;
	setGroupOption: Dispatch<StateUpdater<GroupOption>>;
	viewOption: ViewOption;
	setViewOption: Dispatch<StateUpdater<ViewOption>>;
	allView: boolean;
	setAllView: Dispatch<StateUpdater<boolean>>;
	patternMatchDataGroup: PatternMatchData[];
	filteredDataLength: number;
}) => {
	const selectTarget = useSignal(selectTargetSignal);
	const setSelectTarget = (target: CurrentNode | null) => {
		selectTargetSignal.value = target;
	};

	return (
		<Fragment>
			<Stack space="extraSmall">
				<div className={styles.row}>
					<Dropdown
						onChange={(e) => {
							setSearchOption(e.currentTarget.value as SearchOption);
						}}
						options={[
							{ text: 'text', value: 'text' },
							{ text: 'key', value: 'localizationKey' },
							{ text: 'parent', value: 'parentName' },
							{ text: 'name', value: 'name' },
						]}
						value={searchOption}
					/>

					<SearchTextbox
						onChange={(e) => {
							setSearchValue(e.currentTarget.value);
						}}
						placeholder="검색..."
						value={searchValue}
					/>
					<IconToggleButton
						value={openOption}
						onClick={() => {
							setOpenOption(!openOption);
						}}
					>
						<IconAdjustSmall24></IconAdjustSmall24>
					</IconToggleButton>
				</div>

				{openOption && (
					<div className={styles.rowLeft}>
						<div className={styles.miniColumn}>
							<Bold>그룹 기준</Bold>
							{(Object.keys(groupOption) as Array<keyof GroupOption>).map((key) => {
								const value = groupOption[key];
								return (
									<Toggle value={value} onClick={() => setGroupOption((prev) => ({ ...prev, [key]: !value }))}>
										{key}
									</Toggle>
								);
							})}
						</div>
						<div className={styles.miniColumn}>
							<Bold>보여줄 옵션</Bold>
							{(Object.keys(viewOption) as Array<keyof ViewOption>).map((key) => {
								const value = viewOption[key];
								return (
									<Toggle value={value} onClick={() => setViewOption((prev) => ({ ...prev, [key]: !value }))}>
										{optionAlias[key]}
									</Toggle>
								);
							})}
						</div>
					</div>
				)}
				<Divider />
			</Stack>
			<VerticalSpace space="extraSmall" />
			<div className={styles.row}>
				<div className={styles.rowCenter}>
					<Toggle value={allView} onClick={() => setAllView(!allView)}>
						<Text>{allView ? '전체 텍스트' : '선택한 텍스트'}</Text>
					</Toggle>
				</div>
				<Text>
					그룹 보기: {patternMatchDataGroup.length} / 전체: {filteredDataLength}
				</Text>
			</div>
			<VerticalSpace space="extraSmall" />
			<div className={styles.column}>
				{patternMatchDataGroup
					.sort((a, b) => a.text.localeCompare(b.text))
					.map((item) => {
						return <SearchResult {...item} />;
					})}
			</div>
		</Fragment>
	);
};

/**
 * 그루핑 할때는 아이디를 하위 값으로 두고 속성을 위로 올린다
 * 전체 선택, 또는 선택으로 검색 영역 지정
 * 전체는 너무 많은 것을 지정해서 ... 업데이트에 적합하지 않다고 생각함
 *
 *
 *
 *
 *
 *
 * 신규 등록 메뉴에서는 로컬라이제이션 키 값이 없는 대상을 그루핑
 * 업데이트 > 노드 아이디로 키 추가
 */
function BatchPage() {
	const section = useSignal(currentSectionSignal);

	const selectIds = useSignal(selectIdsSignal);
	const domainSetting = useSignal(domainSettingSignal);

	const selectTarget = useSignal(selectTargetSignal);
	const currentPointer = useSignal(currentPointerSignal);
	const selectedKey = useSignal(selectedKeySignal);

	const { data: searchResult, search, setSearch, selectedKeyData } = useSearch();

	// const hasSelectedKey = typeof selectedKeyData === 'object';
	const hasSelectedKey = selectedKey !== null;

	/** 숨김 대상을 포함할 것인가 */
	const [allView, setAllView] = useState<boolean>(true);

	/** 그루핑 옵션 */
	const [groupOption, setGroupOption] = useState<GroupOption>({
		/** 키 값을 그루핑 파라미터로 사용 */
		localizationKey: true,
		/** 부모 이름을 그루핑 파라미터로 사용 */
		parentName: true,
		/** 이름을 그루핑 파라미터로 사용 */
		name: true,
		/** 텍스트를 그루핑 파라미터로 사용 */
		text: true,
	});
	/** 보여줄 옵션 */
	const [viewOption, setViewOption] = useState<ViewOption>({
		/** 숨김 대상을 표시 */
		ignore: false,
		/** 숨기지 않은 대상을 표시 */
		notIgnore: true,
		/** 키 값이 있는 대상을 표시 */
		hasLocalizationKey: true,
		// hasLocalizationKey: false,
		/** 키 값이 없는 대상을 표시 */
		notHasLocalizationKey: true,
	});

	/** 입력한 키 값 */
	const localizationKey = useSignal(inputKeySignal);

	/** 옵션 열기 */
	const [openOption, setOpenOption] = useState<boolean>(false);

	/** 검색 옵션 */
	const [searchOption, setSearchOption] = useState<SearchOption>('text');

	/** 피그마 텍스트 스캔 데이터 */
	const patternMatchData = useSignal(patternMatchDataSignal);

	const { filteredDataLength, patternMatchData: allPatternData } = groupByPattern(
		patternMatchData as unknown as SearchNodeData[],
		viewOption,
		groupOption
	);

	const missingLink = selectIds.filter((id) => !patternMatchData.some((item) => item.id === id));

	const { data, loading, error, fetchData, hasMessage, setHasMessage } = useFetch<LocalizationKeyDTO>();

	// const textList = Array.from(matchDataSet.values()).sort()

	const [tabValue, setTabValue] = useState<string>('Scan');

	/** 검색 값 */
	const [searchValue, setSearchValue] = useState<string>('');

	const patternMatchDataGroup = allPatternData.filter((item) => {
		{
			/* 검색이 선택 보기 상태면 선택한 아이디를 제공 */
		}
		if (!allView) {
			if (item.ids.some((id) => selectIds.includes(id))) {
				return true;
			} else {
				return false;
			}
		}
		if (searchValue === '') {
			return true;
		}
		return item[searchOption].toLowerCase().includes(searchValue.toLowerCase());
	});

	const nav = ['Scan', 'Search'];
	function handleChange(
		//  event: NonNullableComponentTypeExtract<typeof Tabs, 'onChange'>
		event: Parameters<NonNullableComponentTypeExtract<typeof Tabs, 'onChange'>>[0]
	) {
		const newValue = event.currentTarget.value;
		setTabValue(newValue);
	}
	const options: Array<TabsOption> = [
		{
			children: (
				<SearchSection
					searchOption={searchOption}
					setSearchOption={setSearchOption}
					searchValue={searchValue}
					setSearchValue={setSearchValue}
					openOption={openOption}
					setOpenOption={setOpenOption}
					groupOption={groupOption}
					setGroupOption={setGroupOption}
					viewOption={viewOption}
					setViewOption={setViewOption}
					allView={allView}
					setAllView={setAllView}
					patternMatchDataGroup={patternMatchDataGroup}
					filteredDataLength={filteredDataLength}
				/>
			),
			value: nav[0],
		},
		{
			children: <SearchArea search={search} setSearch={setSearch} data={searchResult ?? []} />,
			value: nav[1],
		},
	] as const;

	useEffect(() => {
		if (hasMessage && loading === false) {
			if (data) {
				modalAlert('"' + data.name + '" 으로 추가 완료');
			} else if (error) {
				console.log('🚀 ~ useEffect ~ error:', error);
				modalAlert(error.message);
			}
			setHasMessage(false);
		}
	}, [hasMessage, loading]);

	const [updateTime, setUpdateTime] = useState<Date>(new Date());

	const updateTimeString = getTimeAgo(updateTime);

	useEffect(() => {
		setUpdateTime(new Date());
	}, [patternMatchData]);

	if (domainSetting?.domainId == null) {
		return <div>도메인 설정이 없습니다.</div>;
	}

	return (
		<div className={styles.miniColumn}>
			<div className={styles.top}>
				<div className={styles.container}>
					<div className={styles.row}>
						<Bold>Key : </Bold>
						<Textbox
							disabled={hasSelectedKey}
							placeholder="새로운 키 값 입력"
							value={hasSelectedKey && selectedKeyData ? selectedKeyData?.name : localizationKey}
							onChange={(e) => {
								const next = keyConventionRegex(e.currentTarget.value);
								inputKeySignal.value = next;
								setSearch(next);
								setTabValue('Search');
							}}
						></Textbox>
						<IconButton
							onClick={() => {
								setSearch('');
								selectedKeySignal.value = null;

								inputKeySignal.value = '';
							}}
						>
							<IconCloseSmall24 />
						</IconButton>
						<Button
							onClick={async () => {
								if (hasSelectedKey && selectedKeyData) {
									// 변경할 키가 있으면 바로 일괄 변경 로직
									const isOriginNull = selectedKeyData.origin_value == null || selectedKeyData.origin_value === '';

									emit(UPDATE_NODE_LOCALIZATION_KEY_BATCH.REQUEST_KEY, {
										domainId: selectedKeyData?.domain_id,
										keyId: selectedKeyData?.key_id,
										originId: isOriginNull ? null : selectedKeyData?.origin_id,
										ids: selectIds,
									});
								} else {
									// 변경할 키가 없으면 추가하고
									const result = await fetchData('/localization/keys', {
										method: 'POST',
										headers: {
											'Content-Type': 'application/json',
										},
										body: JSON.stringify({
											domainId: domainSetting.domainId,
											name: localizationKey,
											isTemporary: true,
										}),
									});

									if (result.data) {
										emit(SET_NODE_LOCALIZATION_KEY_BATCH.REQUEST_KEY, {
											domainId: result.data.domain_id,
											keyId: result.data.key_id,
											ids: selectIds,
										});
									}
								}
							}}
							secondary
						>
							{hasSelectedKey ? '변경' : '추가'}
							{/* {hasSelectedKey ?   '변경' : '추가'} */}
						</Button>
					</div>
					<div className={styles.row}>
						<Muted>선택 된 키 : {selectIds.length}</Muted>
						<div className={styles.row}>
							<Muted>{updateTimeString}</Muted>
							<IconButton
								onClick={() => {
									emit(GET_PATTERN_MATCH_KEY.REQUEST_KEY, selectTarget?.id);
								}}
							>
								<IconSwapSmall24 />
							</IconButton>
						</div>
					</div>

					<SimpleSelect />

					{missingLink.length > 0 && (
						<div className={styles.miniColumn}>
							<Bold>섹션 외 대상</Bold>
							{missingLink.map((item) => {
								const selected = selectIds.includes(item);

								return (
									<Button
										danger
										{...selectStyle(selected)}
										onClick={() => {
											pageNodeZoomAction(item);
										}}
										onContextMenu={(e: TargetedEvent<HTMLButtonElement, MouseEvent>) => {
											e.preventDefault(); // 기본 우클릭 메뉴 방지
											// 아이템이 이미 선택 목록에 있으면 제거하고, 없으면 추가합니다
											if (selectIds.includes(item)) {
												// 제거하고
												selectIdsSignal.value = selectIds.filter((id) => id !== item);
											} else {
												selectIdsSignal.value = [...selectIds, item];
											}
										}}
									>
										{item}
									</Button>
								);
							})}
						</div>
					)}
				</div>
				<Divider />
			</div>

			<Tabs options={options} value={tabValue} onChange={handleChange} />
		</div>
	);
}
export default BatchPage;
