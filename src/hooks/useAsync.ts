import { useState } from 'preact/hooks';

interface AsyncState<T> {
	data: T | null;
	loading: boolean;
	error: {
		message: string;
		details: string;
	} | null;
}

export const useAsync = <T>() => {
	const [state, setState] = useState<AsyncState<T>>({
		data: null,
		loading: false,
		error: null,
	});
	/** 메세지 이벤트 발행 */
	const [hasMessage, setHasMessage] = useState<boolean>(false);

	const executeAsync = async <P extends any[], R = T>(asyncFunction: (...args: P) => Promise<R>, ...args: P) => {
		setHasMessage(true);
		setState((prev) => ({ ...prev, loading: true, error: null }));

		let lastState = { ...state, loading: true, error: null } as AsyncState<T>;

		try {
			const result = await asyncFunction(...args);

			lastState = {
				data: result as unknown as T,
				error: null,
				loading: false,
			};
			setState(() => lastState);
		} catch (error) {
			try {
				const errorDetails =
					typeof error === 'object' ? JSON.stringify(error, Object.getOwnPropertyNames(error)) : String(error);

				lastState = {
					data: null,
					error: {
						message: '오류가 발생했습니다.',
						details: errorDetails,
					},
					loading: false,
				};
				setState(() => lastState);
			} catch (stringifyError) {
				lastState = {
					data: null,
					error: {
						message: '오류가 발생했습니다.',
						details: '에러 정보를 가져올 수 없습니다.',
					},
					loading: false,
				};
				setState(() => lastState);
			}
		}
		return lastState;
	};

	return {
		...state,
		executeAsync,
		hasMessage,
		setHasMessage,
	};
};
