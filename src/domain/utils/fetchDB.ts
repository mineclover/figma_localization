import type { paths } from 'types/i18n'
import { baseURL } from '@/domain/constant'
import { getDomainSetting } from '../Setting/SettingModel'

export const fetchDB = <V extends keyof paths>(url: V, options?: RequestInit) => {
	const domainSetting = getDomainSetting()

	if (!domainSetting) {
		figma.notify('도메인 설정이 없습니다.')
		return new Response(JSON.stringify({ error: '도메인 설정이 없습니다.' }), {
			status: 400,
			headers: {
				'Content-Type': 'application/json',
			},
		})
	}

	return fetch(baseURL + url, {
		...options,
		headers: {
			'Content-Type': 'application/json',
			'X-Domain-Id': domainSetting.domainId.toString(),
		},
	})
}

export const clientFetchDBCurry =
	(domainId?: number | string) =>
	<V extends keyof paths>(url: V, options?: RequestInit) => {
		const headers = {
			'Content-Type': 'application/json',
		} as Record<string, string>
		if (domainId) {
			headers['X-Domain-Id'] = domainId.toString()
		}

		return fetch(baseURL + url, {
			...options,
			headers,
		})
	}

export const pureFetch = <V extends keyof paths>(url: V, options?: RequestInit) => {
	const headers = {
		'Content-Type': 'application/json',
	} as Record<string, string>

	return fetch(baseURL + url, {
		...options,
		headers,
	})
}
