import { useSignal } from '@/hooks/useSignal'
import { h } from 'preact'
import { CurrentNode, currentSectionSignal } from '../Translate/TranslateModel'
import { useEffect, useState } from 'preact/hooks'
import {
	Bold,
	Button,
	Code,
	Container,
	Dropdown,
	IconButton,
	IconChevronDown16,
	IconChevronUp16,
	IconTarget16,
	IconToggleButton,
	Muted,
	SearchTextbox,
	Stack,
	Text,
	Textbox,
	Toggle,
} from '@create-figma-plugin/ui'
import { emit } from '@create-figma-plugin/utilities'
import { GET_LOCALIZATION_KEY_VALUE, GET_PATTERN_MATCH_KEY } from '../constant'
import {
	groupByPattern,
	onPatternMatchResponse,
	PatternMatchData,
	patternMatchDataSignal,
	SearchNodeData,
} from './batchModel'
import styles from './batch.module.css'
import { clc } from '@/components/modal/utils'
import { signal } from '@preact/signals-core'
import { pageNodeZoomAction } from '@/figmaPluginUtils/utilAction'

const selectIdsSignal = signal<string[]>([])

const selectStyle = (selected: boolean) => {
	if (selected) {
		return {
			secondary: false,
		}
	}

	return {
		secondary: true,
	}
}

export const SearchResult = ({ ignore, name, text, parentName, localizationKey, ids }: PatternMatchData) => {
	const [isExtended, setIsExtended] = useState<boolean>(false)

	const selectIds = useSignal(selectIdsSignal)

	return (
		<div className={styles.rowContainer}>
			<div className={styles.column}>
				<div className={styles.row}>
					<Code>text: {text}</Code>

					<IconButton
						onClick={() => {
							setIsExtended(true)
							// ids 리스트 중 하나라도 현재 선택된 리스트에 있는지 확인
							const hasAnyId = ids.some((id) => selectIds.includes(id))
							if (hasAnyId) {
								// 하나라도 있으면 해당 ids 리스트의 모든 항목 제거
								selectIdsSignal.value = selectIds.filter((id) => !ids.includes(id))
							} else {
								// 하나도 없으면 모든 항목 추가
								selectIdsSignal.value = [...selectIds, ...ids]
							}
						}}
					>
						{ids.length.toString()}
					</IconButton>
				</div>
				<div className={styles.row}>
					<Bold className={clc(localizationKey === '' && styles.disabled)}>
						{localizationKey === '' ? 'NULL' : localizationKey}
					</Bold>
					<IconButton
						onClick={() => {
							setIsExtended(!isExtended)
						}}
					>
						{isExtended ? <IconChevronUp16 /> : <IconChevronDown16 />}
					</IconButton>
				</div>
			</div>
			<div className={clc(!isExtended && styles.rowExtended)}>
				<button
					className={styles.button}
					onClick={() => {
						const hasAnyId = ids.some((id) => selectIds.includes(id))
						if (hasAnyId) {
							// 하나라도 있으면 해당 ids 리스트의 모든 항목 제거
							selectIdsSignal.value = selectIds.filter((id) => !ids.includes(id))
						} else {
							// 하나도 없으면 모든 항목 추가
							selectIdsSignal.value = [...selectIds, ...ids]
						}
					}}
				>
					{parentName} / {name}
				</button>

				<div className={styles.wrap}>
					{ids.map((item) => {
						const selected = selectIds.includes(item)

						return (
							<Button
								{...selectStyle(selected)}
								onClick={() => {
									pageNodeZoomAction(item)
								}}
								onContextMenu={(e) => {
									e.preventDefault() // 기본 우클릭 메뉴 방지
									// 아이템이 이미 선택 목록에 있으면 제거하고, 없으면 추가합니다
									if (selectIds.includes(item)) {
										selectIdsSignal.value = selectIds.filter((id) => id !== item)
									} else {
										selectIdsSignal.value = [...selectIds, item]
									}
								}}
							>
								{item}
							</Button>
						)
					})}
				</div>
			</div>
		</div>
	)
}

type SearchOption = 'text' | 'localizationKey' | 'parentName' | 'name'

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
	const section = useSignal(currentSectionSignal)

	const [selectMode, setSelectMode] = useState<boolean>(false)
	const [selectTarget, setSelectTarget] = useState<CurrentNode | null>(null)

	const [ignore, setIgnore] = useState<boolean>(false)
	const [hasLocalizationKey, setHasLocalizationKey] = useState<boolean>(false)
	const [includeParentName, setIncludeParentName] = useState<boolean>(false)

	const [searchValue, setSearchValue] = useState<string>('')
	console.log('🚀 ~ searchValue:', searchValue)
	const [searchOption, setSearchOption] = useState<SearchOption>('text')
	console.log('🚀 ~ searchOption:', searchOption)

	const patternMatchData = useSignal(patternMatchDataSignal)
	// console.log('🚀 ~ BatchPage ~ patternMatchData:', patternMatchData)
	const patternMatchDataGroup = groupByPattern(patternMatchData, ignore, hasLocalizationKey, includeParentName)
	console.log('🚀 ~ BatchPage ~ patternMatchDataGroup:', patternMatchDataGroup)

	const matchDataSet = new Set()

	patternMatchDataGroup.forEach((item) => {
		matchDataSet.add(item.text)
	})

	// const textList = Array.from(matchDataSet.values()).sort()

	useEffect(() => {
		if (section && selectMode) {
			setSelectTarget(section)
			setSelectMode(false)
		}
	}, [section])
	useEffect(() => {
		onPatternMatchResponse()
	}, [])

	return (
		<div className={styles.column}>
			<Stack space="extraSmall">
				이거 인터페이스를 토글이 아니라 셀렉트 박스 그룹으로 변경하는 게 직관적이여 보임 예상되는 그룹은 0. 검색 인식
				방식 1. 데이터 포함 여부 , 2. 그루핑 룰 옵션
				<h1>선택된 값 : {selectTarget?.name}</h1>
				<Toggle value={selectMode} onClick={() => setSelectMode(!selectMode)}>
					섹션 선택 활성화 (선택 버튼 클릭 시 선택 영역 지정)
				</Toggle>
				<Toggle value={ignore} onClick={() => setIgnore(!ignore)}>
					무시 대상 검색에 포함 시킬 지 여부 * 완전 제거 옵션임
				</Toggle>
				<Toggle value={hasLocalizationKey} onClick={() => setHasLocalizationKey(!hasLocalizationKey)}>
					키 값 있는 값만 검색 or 반대 * 검색 영영 지정임
				</Toggle>
				<Toggle value={includeParentName} onClick={() => setIncludeParentName(!includeParentName)}>
					그루핑 분류 기준에 부모 이름 포함할 것인가 * 그루핑 기준 지정임
				</Toggle>
				<div className={styles.row}>
					<IconToggleButton
						value={selectMode}
						onClick={() => {
							setSelectMode(true)
						}}
					>
						<IconTarget16 />
					</IconToggleButton>
					<Text align="left" className={styles.width}>
						{selectTarget?.name ?? '섹션 선택되지 않음'}
					</Text>
					<Button
						className={styles.noWrap}
						// disabled={selectTarget == null
						onClick={() => emit(GET_PATTERN_MATCH_KEY.REQUEST_KEY, selectTarget?.id!)}
					>
						{selectTarget == null ? '전체' : '섹션'} 영역에서 불러오기
					</Button>
				</div>
				<div className={styles.row}>
					<Dropdown
						onChange={(e) => {
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
						onInput={(e) => {
							setSearchValue(e.currentTarget.value)
						}}
						placeholder="Search..."
						value={searchValue}
					/>
				</div>
			</Stack>
			<div className={styles.column}>
				{patternMatchDataGroup
					.filter((item) => {
						if (searchValue === '') {
							return true
						}

						return item[searchOption].toLowerCase().includes(searchValue.toLowerCase())
					})
					.sort((a, b) => a.text.localeCompare(b.text))
					.map((item) => {
						console.log('🚀 ~ .map ~ item:', item)
						return <SearchResult {...item} />
					})}
			</div>
		</div>
	)
}
export default BatchPage
