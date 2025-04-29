type FnState = 'pending' | 'fulfilled' | 'rejected';
type State = Record<string, FnState>;

// 함수 체인 설정을 위한 타입
type ChainConfig<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11> = {
	fn1: (args: T1) => Promise<T2>;
	fn2?: (args: T2) => Promise<T3>;
	fn3?: (args: T3) => Promise<T4>;
	fn4?: (args: T4) => Promise<T5>;
	fn5?: (args: T5) => Promise<T6>;
	fn6?: (args: T6) => Promise<T7>;
	fn7?: (args: T7) => Promise<T8>;
	fn8?: (args: T8) => Promise<T9>;
	fn9?: (args: T9) => Promise<T10>;
	fn10?: (args: T10) => Promise<T11>;
};

// 결과 타입
type ChainResults<T2, T3, T4, T5, T6, T7, T8, T9, T10, T11> = {
	fn1?: T2;
	fn2?: T3;
	fn3?: T4;
	fn4?: T5;
	fn5?: T6;
	fn6?: T7;
	fn7?: T8;
	fn8?: T9;
	fn9?: T10;
	fn10?: T11;
};

// 파이프라인 상태 및 결과를 관리하는 클래스
class FpPipeline<
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
> {
	private config: ChainConfig<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11>;
	private chain: Array<keyof ChainConfig<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11>>;
	private state: State;
	private results: ChainResults<T2, T3, T4, T5, T6, T7, T8, T9, T10, T11>;
	private onStateChange?: (state: State) => void;
	private onResultsChange?: (results: ChainResults<T2, T3, T4, T5, T6, T7, T8, T9, T10, T11>) => void;

	constructor(
		config: ChainConfig<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11>,
		options?: {
			onStateChange?: (state: State) => void;
			onResultsChange?: (results: ChainResults<T2, T3, T4, T5, T6, T7, T8, T9, T10, T11>) => void;
		}
	) {
		this.config = config;
		this.onStateChange = options?.onStateChange;
		this.onResultsChange = options?.onResultsChange;

		// 활성화된 함수 체인 구성
		this.chain = ['fn1'];
		if (config.fn2) this.chain.push('fn2');
		if (config.fn3) this.chain.push('fn3');
		if (config.fn4) this.chain.push('fn4');
		if (config.fn5) this.chain.push('fn5');
		if (config.fn6) this.chain.push('fn6');
		if (config.fn7) this.chain.push('fn7');
		if (config.fn8) this.chain.push('fn8');
		if (config.fn9) this.chain.push('fn9');
		if (config.fn10) this.chain.push('fn10');

		// 초기 상태 생성
		this.state = this.chain.reduce((acc, key) => {
			acc[key] = 'pending';
			return acc;
		}, {} as State);

		this.results = {};
	}

	private updateState(key: string, value: FnState): void {
		this.state = { ...this.state, [key]: value };
		if (this.onStateChange) {
			this.onStateChange(this.state);
		}
	}

	private updateResults(key: string, value: any): void {
		this.results = { ...this.results, [key]: value };
		if (this.onResultsChange) {
			this.onResultsChange(this.results);
		}
	}

	// 각 단계별 비동기 함수 실행기
	private async executeStep<Input, Output>(
		key: keyof ChainConfig<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11>,
		fn: (args: Input) => Promise<Output>,
		args: Input
	): Promise<Output> {
		try {
			const boundFn = fn.bind(this.results);
			const result = await boundFn(args);
			this.updateResults(key as string, result);
			this.updateState(key as string, 'fulfilled');
			return result;
		} catch (error) {
			this.updateState(key as string, 'rejected');
			throw error;
		}
	}

	// 모든 함수가 fulfilled 상태인지 확인
	public get allFulfilled(): boolean {
		return Object.values(this.state).every((status) => status === 'fulfilled');
	}

	// 상태 조회
	public getState(): State {
		return { ...this.state };
	}

	// 결과 조회
	public getResults(): ChainResults<T2, T3, T4, T5, T6, T7, T8, T9, T10, T11> {
		return { ...this.results };
	}

	// 파이프라인 초기화
	public reset(): void {
		this.state = this.chain.reduce((acc, key) => {
			acc[key] = 'pending';
			return acc;
		}, {} as State);
		this.results = {};

		if (this.onStateChange) {
			this.onStateChange(this.state);
		}
		if (this.onResultsChange) {
			this.onResultsChange(this.results);
		}
	}

	// 파이프라인 실행
	public async execute(start: T1): Promise<ChainResults<T2, T3, T4, T5, T6, T7, T8, T9, T10, T11>> {
		this.reset();

		try {
			const result1 = await this.executeStep('fn1', this.config.fn1, start);

			if (this.config.fn2) {
				const result2 = await this.executeStep('fn2', this.config.fn2, result1);

				if (this.config.fn3) {
					const result3 = await this.executeStep('fn3', this.config.fn3, result2);

					if (this.config.fn4) {
						const result4 = await this.executeStep('fn4', this.config.fn4, result3);

						if (this.config.fn5) {
							const result5 = await this.executeStep('fn5', this.config.fn5, result4);

							if (this.config.fn6) {
								const result6 = await this.executeStep('fn6', this.config.fn6, result5);

								if (this.config.fn7) {
									const result7 = await this.executeStep('fn7', this.config.fn7, result6);

									if (this.config.fn8) {
										const result8 = await this.executeStep('fn8', this.config.fn8, result7);

										if (this.config.fn9) {
											const result9 = await this.executeStep('fn9', this.config.fn9, result8);

											if (this.config.fn10) {
												await this.executeStep('fn10', this.config.fn10, result9);
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
			console.error('Chain execution failed:', error);
		}

		return this.getResults();
	}
}

// 사용 예시
const example = async () => {
	type HexString = `0x${string}`;

	const pipeline = new FpPipeline({
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
	});

	const results = await pipeline.execute(1);
	console.log('State:', pipeline.getState());
	console.log('Results:', results);
	console.log('All fulfilled:', pipeline.allFulfilled);
};

export default FpPipeline;

example();
