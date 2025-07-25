import { useCallback } from 'preact/hooks'

export type Action<T = any> = {
	type: string
	payload?: T
}

export type Dispatch<A extends Action = Action> = (action: A) => void

export function useDispatch<T extends Record<string, (...args: any[]) => void>>(
	actions: T
): {
	dispatch: Dispatch
	actions: { [K in keyof T]: (...args: Parameters<T[K]>) => Action }
} {
	const dispatch: Dispatch = useCallback(
		(action: Action) => {
			const handler = actions[action.type]
			if (handler) {
				handler(action.payload)
			} else {
				console.warn(`No handler found for action type: ${action.type}`)
			}
		},
		[actions]
	)

	const actionCreators = {} as { [K in keyof T]: (...args: Parameters<T[K]>) => Action }

	for (const actionType in actions) {
		actionCreators[actionType] = (...args: Parameters<T[typeof actionType]>) => ({
			type: actionType,
			payload: args.length === 1 ? args[0] : args,
		})
	}

	return { dispatch, actions: actionCreators }
}
