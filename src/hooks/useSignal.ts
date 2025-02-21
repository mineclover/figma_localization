import { Signal, effect } from '@preact/signals-core'
import { useState } from 'preact/hooks'

export const useSignal = <T>(signal: Signal<T>): T => {
	const [value, setValue] = useState<T>(signal.value)
	effect(() => {
		setValue(signal.value)
	})
	return value
}
