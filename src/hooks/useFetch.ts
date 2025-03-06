import { baseURL } from '@/domain/constant'
import { useState } from 'preact/hooks'
import { paths } from 'types/i18n'

interface FetchState<T> {
	data: T | null
	loading: boolean
	error: {
		message: string
		details: string
	} | null
}

export const useFetch = <T>() => {
	const [state, setState] = useState<FetchState<T>>({
		data: null,
		loading: false,
		error: null,
	})
	/** 메세지 이벤트 발행 */
	const [hasMessage, setHasMessage] = useState<boolean>(false)

	const fetchData = async <V extends keyof paths>(url: V, options?: RequestInit) => {
		setHasMessage(true)

		setState((prev) => ({ ...prev, loading: true, error: null }))

		try {
			const response = await fetch(baseURL + url, options)

			if (!response.ok) {
				try {
					const result = await response.json()
					if (result.message) {
						setState(() => ({
							data: null,
							error: result,
							loading: false,
						}))
					} else {
						setState(() => ({
							data: null,
							error: {
								message: `요청 실패: ${response.status} ${response.statusText}`,
								details: JSON.stringify(result),
							},
							loading: false,
						}))
					}
				} catch (parseError) {
					setState(() => ({
						data: null,
						error: {
							message: `요청 실패: ${response.status} ${response.statusText}`,
							details: '응답을 파싱할 수 없습니다.',
						},
						loading: false,
					}))
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
			console.log('🚀 ~ fetchData ~ error:', error)
			try {
				const errorDetails =
					typeof error === 'object' ? JSON.stringify(error, Object.getOwnPropertyNames(error)) : String(error)

				setState((prev) => ({
					...prev,
					loading: false,
					error: {
						message: '오류가 발생했습니다.',
						details: errorDetails,
					},
				}))
			} catch (stringifyError) {
				setState((prev) => ({
					...prev,
					loading: false,
					error: {
						message: '오류가 발생했습니다.',
						details: '에러 정보를 가져올 수 없습니다.',
					},
				}))
			}
		}
	}

	return {
		...state,
		fetchData,
		hasMessage,
		setHasMessage,
	}
}
