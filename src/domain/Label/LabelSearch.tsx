import { useFetch } from '@/hooks/useFetch'
import { IconButton, Textbox, IconChevronDown16, IconChevronUp16, IconPlus24 } from '@create-figma-plugin/ui'
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

const NullDisableText = ({
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

const SearchResultItem = ({ key_id, name, section_name, alias }: LocalizationKeyDTO) => {
	console.log('🚀 ~ SearchResultItem ~ { key_id, name, section_name, alias }:', { key_id, name, section_name, alias })
	const [isOpen, setIsOpen] = useState(false)

	return (
		<div className={styles.searchResultItem} key={key_id}>
			<div className={styles.searchResultTop}>
				<NullDisableText className={styles.searchResultAlias} placeholder="별칭 없음" children={alias} />
				<NullDisableText className={styles.searchSectionTagBox} placeholder="섹션 없음" children={section_name} />
			</div>
			<div className={styles.searchResultBottom}>
				<IconButton onClick={() => setIsOpen(!isOpen)}>
					{isOpen ? <IconChevronUp16 /> : <IconChevronDown16 />}
				</IconButton>
				<NullDisableText className={styles.searchResultName} placeholder="이름 없음" children={name} />

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
function LabelSearch() {
	const [search, setSearch] = useState('')
	const { data, loading, error, fetchData } = useFetch<LocalizationKeyDTO[]>()
	console.log('🚀 ~ LabelSearch ~ data:', data)
	const domainSetting = useSignal(domainSettingSignal)

	useEffect(() => {
		const event = onGetDomainSettingResponse()
		return () => {
			event()
		}
	}, [])

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

		fetchData(('/localization/keys/name/' + search) as '/localization/keys/name/{name}', {
			method: 'GET',
			headers: {
				'X-Domain-Id': domainId.toString(),
				'Content-Type': 'application/json',
			},
		})
	}, [search])

	return (
		<Fragment>
			<Textbox placeholder="search" value={search} onChange={(e) => setSearch(e.currentTarget.value)}></Textbox>
			<div className={styles.searchResult}>{data?.map((item) => <SearchResultItem {...item} />)}</div>
		</Fragment>
	)
}
export default LabelSearch
