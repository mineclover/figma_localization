import { baseURL } from '@/domain/constant'
import { useState } from 'preact/hooks'
import { paths } from 'types/i18n'

interface FetchState<T> {
	data: T | null
	loading: boolean
	error: Error | null
}

export const useFetch = <T>() => {
	const [state, setState] = useState<FetchState<T>>({
		data: null,
		loading: false,
		error: null,
	})

	const fetchData = async <V extends keyof paths>(url: V, options?: RequestInit) => {
		try {
			setState((prev) => ({ ...prev, loading: true, error: null }))

			const response = await fetch(baseURL + url, options)

			if (!response.ok) {
				const result = await response.json()
				console.log('🚀 ~ Error result:', result)
				if (result.message) {
					setState(() => ({
						data: null,
						error: result,
						loading: false,
					}))
				} else {
					throw new Error(`HTTP error! status: ${response.status}`)
				}
			} else {
				const result = await response.json()
				setState(() => ({
					data: result,
					error: null,
					loading: false,
				}))
			}
		} catch (error) {
			throw error
		}
	}

	return {
		...state,
		fetchData,
	}
}
