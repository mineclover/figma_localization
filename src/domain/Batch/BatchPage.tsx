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
	IconEyeSmall24,
	IconHiddenSmall24,
	IconPrototyping24,
	IconSwapSmall24,
	IconToggleButton,
	IconVisible16,
	Muted,
	SearchTextbox,
	Stack,
	Tabs,
	type TabsOption,
	Text,
	Textbox,
	Toggle,
	VerticalSpace,
} from '@create-figma-plugin/ui'
import { emit } from '@create-figma-plugin/utilities'
import { Fragment, h } from 'preact'
import { type Dispatch, type StateUpdater, useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks'
import type { NonNullableComponentTypeExtract } from 'types/utilType'
import { modalAlert } from '@/components/alert'
import { clc } from '@/components/modal/utils'
import { pageNodeZoomAction } from '@/figmaPluginUtils/utilAction'
import { useFetch } from '@/hooks/useFetch'
import { useSignal } from '@/hooks/useSignal'
import {
	currentPointerSignal,
	currentSectionSignal,
	domainSettingSignal,
	inputKeySignal,
	patternMatchDataSignal,
	selectedKeyDataSignal,
	selectedKeySignal,
	selectIdsSignal,
} from '@/model/signal'
import {
	CurrentNode,
	type GroupOption,
	type LocalizationKeyDTO,
	type PatternMatchData,
	type SearchNodeData,
	type ViewOption,
} from '@/model/types'
import { getTimeAgo } from '@/utils/time'
import { GET_LOCALIZATION_KEY_VALUE, GET_PATTERN_MATCH_KEY } from '../constant'
import { SearchArea, useSearch } from '../Label/LabelSearch'
import { clientFetchDBCurry } from '../utils/fetchDB'
import styles from './batch.module.css'
import { groupByPattern } from './batchModel'
import { SearchResult } from './components/SearchResult'
import SimpleSelect from './SimpleSelect'
import { useBatchActions } from './useBatchActions'

type SearchOption = 'text' | 'localizationKey' | 'parentName' | 'name'

const optionAlias = {
	text: '텍스트',
	localizationKey: '키 값',
	parentName: '부모 이름',
	name: '이름',
	ignore: '숨김 대상',
	notIgnore: '표시 대상',
	hasLocalizationKey: '키 값 있음',
	notHasLocalizationKey: '키 값 없음',
}

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
	dispatch,
}: {
	searchOption: SearchOption
	setSearchOption: Dispatch<StateUpdater<SearchOption>>
	searchValue: string
	setSearchValue: Dispatch<StateUpdater<string>>
	openOption: boolean
	setOpenOption: Dispatch<StateUpdater<boolean>>

	groupOption: GroupOption
	setGroupOption: Dispatch<StateUpdater<GroupOption>>
	viewOption: ViewOption
	setViewOption: Dispatch<StateUpdater<ViewOption>>
	allView: boolean
	setAllView: Dispatch<StateUpdater<boolean>>
	patternMatchDataGroup: PatternMatchData[]
	filteredDataLength: number
	dispatch: Dispatch<any>
}) => {
	return (
		<Fragment>
			<Stack space="extraSmall">
				<div className={styles.row}>
					<Dropdown
						onChange={e => {
							setSearchOption(e.currentTarget.value as SearchOption)
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
						onChange={e => {
							setSearchValue(e.currentTarget.value)
						}}
						placeholder="검색..."
						value={searchValue}
					/>
					<IconToggleButton
						value={openOption}
						onClick={() => {
							setOpenOption(!openOption)
						}}
					>
						<IconAdjustSmall24></IconAdjustSmall24>
					</IconToggleButton>
				</div>

				{openOption && (
					<div className={styles.rowLeft}>
						<div className={styles.miniColumn}>
							<Bold>그룹 기준</Bold>
							{(Object.keys(groupOption) as Array<keyof GroupOption>).map(key => {
								const value = groupOption[key]
								return (
									<Toggle value={value} onClick={() => setGroupOption(prev => ({ ...prev, [key]: !value }))}>
										{key}
									</Toggle>
								)
							})}
						</div>
						<div className={styles.miniColumn}>
							<Bold>보여줄 옵션</Bold>
							{(Object.keys(viewOption) as Array<keyof ViewOption>).map(key => {
								const value = viewOption[key]
								return (
									<Toggle value={value} onClick={() => setViewOption(prev => ({ ...prev, [key]: !value }))}>
										{optionAlias[key]}
									</Toggle>
								)
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
					.map(item => {
						return <SearchResult {...item} dispatch={dispatch} />
					})}
			</div>
		</Fragment>
	)
}

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
	const _section = useSignal(currentSectionSignal)

	const selectIds = useSignal(selectIdsSignal)
	const domainSetting = useSignal(domainSettingSignal)

	const currentPointer = useSignal(currentPointerSignal)
	const selectedKey = useSignal(selectedKeySignal)
	const selectedKeyData = useSignal(selectedKeyDataSignal)
	const { data: searchResult, search, setSearch } = useSearch()
	const { dispatch, actions } = useBatchActions()

	// const hasSelectedKey = typeof selectedKeyData === 'object';
	const hasSelectedKey = selectedKey !== null

	/** 숨김 대상을 포함할 것인가 */
	const [allView, setAllView] = useState<boolean>(true)

	/** 그루핑 옵션 */
	const [groupOption, setGroupOption] = useState<GroupOption>({
		/** 키 값을 그루핑 파라미터로 사용 */
		localizationKey: false,
		/** 부모 이름을 그루핑 파라미터로 사용 */
		parentName: false,
		/** 이름을 그루핑 파라미터로 사용 */
		name: false,
		/** 텍스트를 그루핑 파라미터로 사용 */
		text: true,
	})
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
	})

	/** 입력한 키 값 */
	const localizationKey = useSignal(inputKeySignal)

	/** 옵션 열기 */
	const [openOption, setOpenOption] = useState<boolean>(false)

	/** 검색 옵션 */
	const [searchOption, setSearchOption] = useState<SearchOption>('text')

	/** 피그마 텍스트 스캔 데이터 */
	const patternMatchData = useSignal(patternMatchDataSignal)

	const { filteredDataLength, patternMatchData: allPatternData } = groupByPattern(
		patternMatchData as unknown as SearchNodeData[],
		viewOption,
		groupOption
	)

	const { data, loading, error, fetchData, hasMessage, setHasMessage } = useFetch<LocalizationKeyDTO>()

	// const textList = Array.from(matchDataSet.values()).sort()

	const [tabValue, setTabValue] = useState<string>('Scan')

	/** 검색 값 */
	const [searchValue, setSearchValue] = useState<string>('')

	const patternMatchDataGroup = allPatternData.filter(item => {
		if (!allView) {
			if (item.ids.some(id => selectIds.includes(id))) {
				return true
			} else {
				return false
			}
		}
		if (searchValue === '') {
			return true
		}
		return item[searchOption].toLowerCase().includes(searchValue.toLowerCase())
	})

	const nav = ['Scan', 'Search']
	function handleChange(
		//  event: NonNullableComponentTypeExtract<typeof Tabs, 'onChange'>
		event: Parameters<NonNullableComponentTypeExtract<typeof Tabs, 'onChange'>>[0]
	) {
		const newValue = event.currentTarget.value
		setTabValue(newValue)
	}
	const searchHandler = (key: string) => {
		dispatch(actions.searchKey([key, setSearch, setTabValue]))
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
					dispatch={dispatch}
				/>
			),
			value: nav[0],
		},
		{
			children: <SearchArea search={search} data={searchResult ?? []} searchHandler={searchHandler} />,
			value: nav[1],
		},
	] as const

	useEffect(() => {
		if (hasMessage && loading === false) {
			if (data) {
				modalAlert(`"${data.name}" 으로 추가 완료`)
			} else if (error) {
				modalAlert(error.message)
			}
			setHasMessage(false)
		}
	}, [hasMessage, loading, data, error, setHasMessage])

	const [updateTime, setUpdateTime] = useState<Date>(new Date())

	const updateTimeString = getTimeAgo(updateTime)

	useEffect(() => {
		setUpdateTime(new Date())
	}, [])

	if (domainSetting?.domainId == null) {
		return <div>도메인 설정이 없습니다.</div>
	}

	return (
		<div className={styles.miniColumn}>
			<div className={styles.top}>
				<div className={styles.container}>
					<div className={styles.row}>
						<Muted className={styles.noWrapSecondary}>선택 된 키 : {selectIds.length}</Muted>

						<div className={styles.row}>
							<Muted className={styles.noWrapSecondary}>{updateTimeString}</Muted>
							<IconButton onClick={() => dispatch(actions.refreshPatternMatch())}>
								<IconSwapSmall24 />
							</IconButton>
						</div>
					</div>

					<SimpleSelect />
					{/* <span className={clc(styles.text, currentPointer?.characters == null && styles.dangerText)}>
						{currentPointer?.characters ?? 'Text 선택 안됨'}
					</span> */}
					<div className={styles.row}>
						<Bold>Key : </Bold>
						<Textbox
							disabled={hasSelectedKey}
							placeholder="새로운 키 값 입력"
							value={hasSelectedKey && selectedKeyData ? selectedKeyData?.name : localizationKey}
							onChange={e => {
								searchHandler(e.currentTarget.value)
							}}
						></Textbox>
						<IconButton onClick={() => dispatch(actions.clearKeySelection([setSearch]))}>
							<IconCloseSmall24 />
						</IconButton>
						<Button
							onClick={() =>
								dispatch(
									actions.updateLocalizationKey([
										hasSelectedKey,
										selectedKeyData,
										selectIds,
										domainSetting,
										localizationKey,
										currentPointer,
										fetchData,
									])
								)
							}
							secondary
						>
							{hasSelectedKey ? '변경' : '추가'}
							{/* {hasSelectedKey ?   '변경' : '추가'} */}
						</Button>
					</div>
				</div>
				<Divider />
			</div>

			<Tabs options={options} value={tabValue} onChange={handleChange} />
		</div>
	)
}
export default BatchPage
