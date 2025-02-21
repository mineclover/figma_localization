import { modalAlert } from '@/components/alert'
import { addLayer } from '@/components/modal/Modal'
import { useFetch } from '@/hooks/useFetch'
import { ComponentChildren, Fragment, h } from 'preact'
import { useEffect, useMemo, useState } from 'preact/hooks'
import { components } from 'types/i18n'

function SettingPage() {
	const { data, loading, error, fetchData } = useFetch<components['schemas']['Domain'][]>()

	useEffect(() => {
		fetchData('/domains', {
			method: 'GET',
		})
	}, [])

	return (
		<div>
			{data?.map((domain) => (
				<div key={domain.domain_id}>
					{domain.domain_id} : {domain.domain_name}
				</div>
			))}
		</div>
	)
}
export default SettingPage
