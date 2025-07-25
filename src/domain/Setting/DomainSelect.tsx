import { IconCheck16 } from '@create-figma-plugin/ui'
import { emit } from '@create-figma-plugin/utilities'
import { ComponentChildren, Fragment, h } from 'preact'
import { useEffect, useMemo, useState } from 'preact/hooks'
import { components } from 'types/i18n'
import { useFetch } from '@/hooks/useFetch'
import { SET_DOMAIN_PAIR } from '../constant'
import styles from './domainSelect.module.css'

function DomainSelect({ domainId, domainName, select }: { domainId: number; domainName: string; select: boolean }) {
	return (
		<button
			type="button"
			className={styles.button}
			onClick={() => {
				// 도메인 업데이트에 의해 useEffect에서 언어 코드도 업데이트 됨으로
				// 언어코드 업데이트는 필요 없다 하지만 useEffect를 제거하면 필요해짐
				emit(SET_DOMAIN_PAIR.REQUEST_KEY, {
					domainId,
					domainName,
				})
			}}
		>
			{select ? <IconCheck16 /> : <div style={{ width: 12, height: 12 }} />}
			<span>{domainName}</span> <span className={styles.tag}>#{domainId}</span>
		</button>
	)
}
export default DomainSelect
