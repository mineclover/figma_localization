import { baseURL } from '@/domain/constant'

import { paths } from 'types/i18n'

export const fetchDB = <V extends keyof paths>(url: V, options?: RequestInit) => {
	return fetch(baseURL + url, {
		...options,
		headers: {
			'Content-Type': 'application/json',
		},
	})
}
