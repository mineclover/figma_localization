import { useFetch } from '@/hooks/useFetch'
import { emit } from '@create-figma-plugin/utilities'
import { ComponentChildren, Fragment, h } from 'preact'
import { useEffect, useMemo, useState } from 'preact/hooks'
import { components } from 'types/i18n'
import { SET_DOMAIN_PAIR } from '../constant'
import { IconControlCheckboxChecked12 } from '@create-figma-plugin/ui'
import styles from './domainSelect.module.css'
function DomainSelect({ domainId, domainName, select }: { domainId: number; domainName: string; select: boolean }) {
	return (
		<button
			className={styles.button}
			onClick={() => {
				emit(SET_DOMAIN_PAIR.REQUEST_KEY, {
					domainId,
					domainName,
				})
			}}
		>
			{select ? <IconControlCheckboxChecked12 /> : <div style={{ width: 12, height: 12 }} />}
			<span>{domainName}</span> <span className={styles.tag}>#{domainId}</span>
		</button>
	)
}
export default DomainSelect
