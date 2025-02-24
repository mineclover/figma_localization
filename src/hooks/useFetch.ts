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
				throw new Error(`HTTP error! status: ${response.status}`)
			}

			const result = await response.json()

			setState((prev) => ({
				...prev,
				data: result,
				loading: false,
			}))

			return result
		} catch (error) {
			setState((prev) => ({
				...prev,
				error: error as Error,
				loading: false,
			}))
			throw error
		}
	}

	return {
		...state,
		fetchData,
	}
}
