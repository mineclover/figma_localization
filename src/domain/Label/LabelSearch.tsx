import { useFetch } from '@/hooks/useFetch'
import {
	IconButton,
	Textbox,
	Text,
	IconChevronDown16,
	IconChevronUp16,
	IconPlus24,
	IconStar16,
	IconLockUnlocked16,
	IconLockLocked16,
	Toggle,
	VerticalSpace,
	SearchTextbox,
} from '@create-figma-plugin/ui'
import { Fragment, h } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import { LocalizationKeyDTO } from './TextPluginDataModel'
import { currentPointerSignal } from './LabelModel'
import { useSignal } from '@/hooks/useSignal'
import { domainSettingSignal, onGetDomainSettingResponse } from '../Setting/SettingModel'
import styles from './LabelPage.module.css'
import { clc } from '@/components/modal/utils'
import { UPDATE_NODE_STORE_KEY } from '../constant'
import { emit } from '@create-figma-plugin/utilities'
import { modalAlert } from '@/components/alert'
import { computed, signal } from '@preact/signals-core'
import { keyConventionRegex } from '@/utils/textTools'

export const NullDisableText = ({
	className,
	placeholder,
	children,
}: {
	className?: string
	placeholder?: string
	children?: string
}) => {
	return (
		<span className={clc(className, children == null && styles.textDisabled)}>
			{children == null ? placeholder : children}
		</span>
	)
}
export const selectedKeySignal = signal<string | null>(null)
export const isBatchSignal = signal<boolean>(false)
export const isTravelSignal = signal<boolean>(false)

const nameOrAliasIcon = (isNameOpen: boolean, is_temporary: number) => {
	if (isNameOpen) {
		return is_temporary === 1 ? <IconLockUnlocked16 /> : <IconLockLocked16 />
	}
	return <IconStar16 />
}

const SearchResultItem = ({ key_id, name, section_name, alias, is_temporary, origin_value }: LocalizationKeyDTO) => {
	const [isOpen, setIsOpen] = useState(false)
	const [isNameOpen, setIsNameOpen] = useState(true)

	return (
		<div
			className={clc(
				styles.searchResultItem,
				selectedKeySignal.value === key_id.toString() && styles.searchResultItemSelected
			)}
			key={key_id}
			onClick={() => (selectedKeySignal.value = key_id.toString())}
		>
			<div className={styles.searchResultTop}>
				<IconButton onClick={() => setIsNameOpen(!isNameOpen)}>{nameOrAliasIcon(isNameOpen, is_temporary)}</IconButton>
				{!isNameOpen ? (
					<NullDisableText className={styles.searchResultAlias} placeholder="별칭 없음" children={alias} />
				) : (
					<NullDisableText className={styles.searchResultName} placeholder="이름 없음" children={name} />
				)}
				<NullDisableText className={styles.searchSectionTagBox} placeholder="섹션 없음" children={section_name} />
			</div>
			<div className={styles.searchResultBottom}>
				<IconButton onClick={() => setIsOpen(!isOpen)}>
					{isOpen ? <IconChevronUp16 /> : <IconChevronDown16 />}
				</IconButton>
				<NullDisableText className={styles.searchResultName} placeholder="원본 값 없음" children={origin_value} />

				<IconButton
					// className={styles.searchResultSubmitButton}
					onClick={() => emit(UPDATE_NODE_STORE_KEY.REQUEST_KEY, key_id)}
				>
					<IconPlus24></IconPlus24>
				</IconButton>
			</div>
		</div>
	)
}

export const SearchArea = ({
	search,
	setSearch,
	data,
}: {
	search: string
	setSearch: (search: string) => void
	data: LocalizationKeyDTO[]
}) => {
	return (
		<Fragment>
			<VerticalSpace space="extraSmall"></VerticalSpace>
			<SearchTextbox
				key={'searchTextbox'}
				placeholder="Search..."
				value={search}
				onChange={(e) => {
					setSearch(e.currentTarget.value)
					// setSearch(keyConventionRegex(e.currentTarget.value))
				}}
			></SearchTextbox>
			<div className={styles.searchResult}>{data?.map((item) => <SearchResultItem {...item} />)}</div>
		</Fragment>
	)
}

export const useSearch = () => {
	const [search, setSearch] = useState('')
	const { data, loading, error, fetchData } = useFetch<LocalizationKeyDTO[]>()
	const domainSetting = useSignal(domainSettingSignal)
	const selectedKey = useSignal(selectedKeySignal)

	const selectedKeyData = computed(() => {
		return data?.find((item) => item.key_id.toString() === (selectedKey ?? '0'))
	})

	useEffect(() => {
		console.log('🚀 ~ useEffect ~ loading:', loading)
		if (loading) {
			return
		}
		const domainId = domainSetting?.domainId
		console.log('🚀 ~ useEffect ~ domainId:', domainId)
		if (!domainId) {
			return
		}
		if (search.length === 0) {
			return
		}

		fetchData(('/localization/keys/name/' + search) as '/localization/keys/name/{name}', {
			method: 'GET',
			headers: {
				'X-Domain-Id': domainId.toString(),
				'Content-Type': 'application/json',
			},
		})
		return () => {
			selectedKeySignal.value = null
		}
	}, [search])

	return { search, setSearch, selectedKeyData, data, loading, error, fetchData }
}

/** search bar */
function LabelSearch() {
	const { data, search, setSearch } = useSearch()

	const isBatch = useSignal(isBatchSignal)

	const isTravel = useSignal(isTravelSignal)

	const currentPointer = useSignal(currentPointerSignal)
	const selectedKey = useSignal(selectedKeySignal)

	// 즉시 적용 기능
	useEffect(() => {
		if (isBatch && selectedKey && currentPointer) {
			console.log('🚀 ~ useEffect ~ currentPointer:', currentPointer)
			emit(UPDATE_NODE_STORE_KEY.REQUEST_KEY, selectedKey)
		}
	}, [currentPointer?.nodeId])

	return (
		<Fragment>
			{/* <Toggle onChange={() => setIsTravel(!isTravel)} value={isTravel}>
			<Text>유사 패턴 탐색 (등록 시 유사 패턴 일괄 적용)</Text>
		</Toggle> */}
			<VerticalSpace space="extraSmall"></VerticalSpace>

			<Toggle onChange={() => (isBatchSignal.value = !isBatch)} value={isBatch}>
				<Text>즉시 적용 (alt + click 추천)</Text>
				<VerticalSpace space="extraSmall"></VerticalSpace>
				<Text>검색 창에서 선택된 상태로 피그마 텍스트 클릭 시 반영</Text>
			</Toggle>
			<SearchArea search={search} setSearch={setSearch} data={data ?? []} />
		</Fragment>
	)
}
export default LabelSearch
