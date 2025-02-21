import { modalAlert } from '@/components/alert'
import { addLayer } from '@/components/modal/Modal'
import { useFetch } from '@/hooks/useFetch'
import { ComponentChildren, Fragment, h } from 'preact'
import { useEffect, useMemo, useState } from 'preact/hooks'
import { components } from 'types/i18n'
import {
	domainSettingSignal,
	languageCodesSignal,
	onGetDomainSettingResponse,
	onGetLanguageCodesResponse,
} from './SettingModel'
import DomainSelect from './DomainSelect'
import { useSignal } from '@/hooks/useSignal'
import { Bold, Button, Container, Stack, VerticalSpace } from '@create-figma-plugin/ui'
import styles from './domainSelect.module.css'

function SettingPage() {
	const { data, loading, error, fetchData } = useFetch<components['schemas']['Domain'][]>()
	const domainSetting = useSignal(domainSettingSignal)

	const languageCodes = useSignal(languageCodesSignal)

	useEffect(() => {
		if (data && domainSetting) {
			const domain = data.find((domain) => domain.domain_id === domainSetting.domainId)
			if (domain) {
				languageCodesSignal.value = domain.language_codes
			}
		}
	}, [domainSetting])

	useEffect(() => {
		fetchData('/domains', {
			method: 'GET',
		})
		const event = onGetDomainSettingResponse()
		const event2 = onGetLanguageCodesResponse()
		return () => {
			event()
			event2()
		}
	}, [])

	return (
		<Container space="extraSmall">
			<VerticalSpace space="extraSmall" />
			<div className={styles.container}>
				<div className={styles.domainContainer}>
					<Bold>Domain</Bold>
					<Button
						onClick={() => {
							fetchData('/domains', {
								method: 'GET',
							})
						}}
					>
						update
					</Button>
				</div>
				{data?.map((domain) => (
					<DomainSelect
						key={domain.domain_id}
						domainId={domain.domain_id}
						domainName={domain.domain_name}
						select={domainSetting?.domainId === domain.domain_id}
					/>
				))}
			</div>
			<VerticalSpace space="extraSmall" />
			<div className={styles.container}>
				<div className={styles.domainContainer}>
					<Bold>Language Codes</Bold>
				</div>
				<div className={styles.languageCodesContainer}>
					{languageCodes.map((languageCode, index) => {
						if (index === 0) {
							return <span key={index}>{languageCode}</span>
						}
						return (
							<Fragment key={index}>
								<span>/</span>
								<span>{languageCode}</span>
							</Fragment>
						)
					})}
				</div>
			</div>
		</Container>
	)
}
export default SettingPage
