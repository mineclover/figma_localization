import { useState } from 'preact/hooks'
import type { paths } from 'types/i18n'
import { baseURL } from '@/domain/constant'

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
		setState(prev => ({ ...prev, loading: true, error: null }))

		let lastState = { ...state, loading: true, error: null } as FetchState<T>

		try {
			const response = await fetch(baseURL + url, options)

			if (!response.ok) {
				try {
					const result = await response.json()
					if (result.message) {
						lastState = {
							data: null,
							error: result,
							loading: false,
						}
						setState(() => lastState)
					} else {
						lastState = {
							data: null,
							error: {
								message: `요청 실패: ${response.status} ${response.statusText}`,
								details: JSON.stringify(result),
							},
							loading: false,
						}
						setState(() => lastState)
					}
				} catch (_parseError) {
					lastState = {
						data: null,
						error: {
							message: `요청 실패: ${response.status} ${response.statusText}`,
							details: '응답을 파싱할 수 없습니다.',
						},
						loading: false,
					}
					setState(() => lastState)
				}
			} else {
				const result = await response.json()
				lastState = {
					data: result,
					error: null,
					loading: false,
				}
				setState(() => lastState)
			}
		} catch (error) {
			try {
				const errorDetails =
					typeof error === 'object' ? JSON.stringify(error, Object.getOwnPropertyNames(error)) : String(error)

				lastState = {
					data: null,
					error: {
						message: '오류가 발생했습니다.',
						details: errorDetails,
					},
					loading: false,
				}
				setState(() => lastState)
			} catch (_stringifyError) {
				lastState = {
					data: null,
					error: {
						message: '오류가 발생했습니다.',
						details: '에러 정보를 가져올 수 없습니다.',
					},
					loading: false,
				}
				setState(() => lastState)
			}
		}
		return lastState
	}

	return {
		...state,
		fetchData,
		hasMessage,
		setHasMessage,
	}
}
