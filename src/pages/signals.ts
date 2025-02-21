// signals.js
import { signal, computed } from '@preact/signals-core'

export const count = signal(0)
export const multiplier = signal(2)
export const price = signal(1000)

// computed 시그널은 의존하는 시그널이 변경될 때 자동으로 재계산됨
export const doubleCount = computed(() => count.value * multiplier.value)
export const total = computed(() => doubleCount.value * price.value)
