import { useEffect, useMemo, useRef, useState } from 'preact/hooks'

type FnState = 'pending' | 'fulfilled' | 'rejected'
type State = Record<string, FnState>

// 함수 체인 설정을 위한 타입
type ChainConfig<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11> = {
	fn1: (args: T1) => Promise<T2>
	fn2?: (args: T2) => Promise<T3>
	fn3?: (args: T3) => Promise<T4>
	fn4?: (args: T4) => Promise<T5>
	fn5?: (args: T5) => Promise<T6>
	fn6?: (args: T6) => Promise<T7>
	fn7?: (args: T7) => Promise<T8>
	fn8?: (args: T8) => Promise<T9>
	fn9?: (args: T9) => Promise<T10>
	fn10?: (args: T10) => Promise<T11>
}

const useFp = <
	T1,
	T2 = void,
	T3 = void,
	T4 = void,
	T5 = void,
	T6 = void,
	T7 = void,
	T8 = void,
	T9 = void,
	T10 = void,
	T11 = void,
>(
	start: T1,
	config: ChainConfig<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11>
) => {
	// 활성화된 함수 체인 구성
	const chain = useMemo(() => {
		const activeChain: Array<keyof ChainConfig<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11>> = ['fn1']
		if (config.fn2) {
			activeChain.push('fn2')
		}
		if (config.fn3) {
			activeChain.push('fn3')
		}
		if (config.fn4) {
			activeChain.push('fn4')
		}
		if (config.fn5) {
			activeChain.push('fn5')
		}
		if (config.fn6) {
			activeChain.push('fn6')
		}
		if (config.fn7) {
			activeChain.push('fn7')
		}
		if (config.fn8) {
			activeChain.push('fn8')
		}
		if (config.fn9) {
			activeChain.push('fn9')
		}
		if (config.fn10) {
			activeChain.push('fn10')
		}
		return activeChain
	}, [config])

	// 초기 상태 생성
	const initialState = useMemo(() => {
		return chain.reduce((acc, key) => {
			acc[key] = 'pending'
			return acc
		}, {} as State)
	}, [chain])

	const [state, setState] = useState<State>(initialState)

	const results = useRef<{
		fn1?: T2
		fn2?: T3
		fn3?: T4
		fn4?: T5
		fn5?: T6
		fn6?: T7
		fn7?: T8
		fn8?: T9
		fn9?: T10
		fn10?: T11
	}>({})

	// 모든 함수가 fulfilled 상태인지 확인
	const allFulfilled = useMemo(() => {
		return Object.values(state).every(status => status === 'fulfilled')
	}, [state])

	const reset = () => {
		setState(initialState)
		results.current = {}
	}

	// 각 단계별 비동기 함수 실행기
	const executeStep = async <Input, Output>(
		key: keyof ChainConfig<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11>,
		fn: (args: Input) => Promise<Output>,
		args: Input
	) => {
		try {
			const boundFn = fn.bind(results.current)
			const result = await boundFn(args)
			results.current = { ...results.current, [key]: result }
			setState(prev => ({ ...prev, [key]: 'fulfilled' }))
			return result
		} catch (error) {
			setState(prev => ({ ...prev, [key]: 'rejected' }))
			throw error
		}
	}

	useEffect(() => {
		reset()
	}, [reset])

	useEffect(() => {
		const executeChain = async () => {
			try {
				if (state.fn1 === 'pending') {
					const result1 = await executeStep('fn1', config.fn1, start)

					if (config.fn2 && state.fn2 === 'pending') {
						const result2 = await executeStep('fn2', config.fn2, result1)

						if (config.fn3 && state.fn3 === 'pending') {
							const result3 = await executeStep('fn3', config.fn3, result2)

							if (config.fn4 && state.fn4 === 'pending') {
								const result4 = await executeStep('fn4', config.fn4, result3)

								if (config.fn5 && state.fn5 === 'pending') {
									const result5 = await executeStep('fn5', config.fn5, result4)

									if (config.fn6 && state.fn6 === 'pending') {
										const result6 = await executeStep('fn6', config.fn6, result5)

										if (config.fn7 && state.fn7 === 'pending') {
											const result7 = await executeStep('fn7', config.fn7, result6)

											if (config.fn8 && state.fn8 === 'pending') {
												const result8 = await executeStep('fn8', config.fn8, result7)

												if (config.fn9 && state.fn9 === 'pending') {
													const result9 = await executeStep('fn9', config.fn9, result8)

													if (config.fn10 && state.fn10 === 'pending') {
														await executeStep('fn10', config.fn10, result9)
													}
												}
											}
										}
									}
								}
							}
						}
					}
				}
			} catch (error) {
				console.error('Chain execution failed:', error)
			}
		}

		executeChain()
	}, [state, config, start, executeStep])

	return {
		state,
		results: results.current,
		allFulfilled,
		reset,
	}
}

// 사용 예시
const _Example = () => {
	type HexString = `0x${string}`

	const { state, results } = useFp(1, {
		fn1: async (num: number) => num + 1,
		fn2: async (num: number) => num.toString(),
		fn3: async (str: string) => parseInt(str) * 2,
		fn4: async (num: number) => num > 5,
		fn5: async (bool: boolean) => (bool ? 'success' : 'fail'),
		fn6: async (str: string) => str.length,
		fn7: async (num: number) => new Date(num),
		fn8: async (date: Date) => date.getTime(),
		fn9: async (time: number) => time.toString(16),
		fn10: async (hex: string): Promise<HexString> => `0x${hex}`,
	})

	return null
}

export default useFp
