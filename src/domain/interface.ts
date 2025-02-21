import { on, once, emit, EventHandler } from '@create-figma-plugin/utilities'
import { generateRandomText2 } from '../utils/textTools'
import { DuplexKeysType, DynamicDuplexType } from './duplex'

/**
 * 데이터 인터페이스 제네릭이긴 한데...
 * 그냥 handler는 값 하나만 보내는걸로 처리하는게 깔끔한듯
 */
// export interface OnceHandler<T extends Array<any>> extends EventHandler {
// 	name: string
// 	handler: (...args: T) => void
// }

/**
 * 데이터 인터페이스 v1
 */
export interface DataHandler extends EventHandler {
	name: string
	handler: (args: any) => void
}

/**
 * 시그널 인터페이스 v1
 */
export interface SignalHandler extends EventHandler {
	name: string
	handler: (random?: string) => void
}

export interface DataHandlerV2<T extends string, U> extends EventHandler {
	name: ConcatStrings<'DATA_', T>
	handler: (args: U) => void
}
// 예시
// export type DataUserHandler = DuplexDataHandler<'user'>

/**
 * Duplex 호환
 * 시그널 인터페이스 v2
 */
export interface SignalHandlerV2<T extends string> extends EventHandler {
	name: ConcatStrings<'SIGNAL_', T>
	handler: (random?: string) => void
}

/**
 * Duplex 호환
 * 데이터 인터페이스 v2
 */
export interface DuplexDataHandler<T extends DuplexKeysType> extends EventHandler {
	name: DuplexConcatStrings<'DATA_', T>
	handler: (args: DynamicDuplexType<T>['data']) => void
}
// 예시
// export type DataUserHandler = DuplexDataHandler<'user'>

/**
 * Duplex 호환
 * 시그널 인터페이스 v2
 */
export interface DuplexSignalHandler<T extends DuplexKeysType> extends EventHandler {
	name: DuplexConcatStrings<'SIGNAL_', T>
	handler: (random?: string) => void
}
/**
 * 시그널 인터페이스 v2 코드 예시
 * 받는 코드는 위에서 처리할 수 있게 구성
 */
export type SignalUserHandler = DuplexSignalHandler<'user'>

/** 시그널 반응
 * 랜덤 여부 맞춰서 emit 실행됨
 * key에 random 없으면 공백으로 처리
 */
export const signalReceiving = <T extends DuplexKeysType>(type: T, randomKey?: string) => {
	const key = prefix['data'] + type + (randomKey ?? '')
	return (arg: DynamicDuplexType<T>['data']) => dataEmit(key, arg)
}

/** v1 예시 */
// 써도 되는 구간은 정해진 키를 기반으로 정해진 호출이 있어서 괜찮긴 했음
// 비슷하게 duplexKeys base로 키에 맞춰서 handler 파라미터 자동 추론하는 것도 가능해보여서 v2 만듬
export const dataOn = on<DataHandler>
export const dataOnce = once<DataHandler>
export const dataEmit = emit<DataHandler>
export const signalOn = on<SignalHandler>
export const signalOnce = once<SignalHandler>
export const signalEmit = emit<SignalHandler>

/** v2 예시 */
// export const userDataOn = on<DuplexDataHandler<'user'>>
// export const userDataOnce = once<DuplexDataHandler<'user'>>
// export const userDataEmit = emit<DuplexDataHandler<'user'>>
// export const userSignalOn = on<DuplexSignalHandler<'user'>>
// export const userSignalOnce = once<DuplexSignalHandler<'user'>>
// export const userSignalEmit = emit<DuplexSignalHandler<'user'>>

/**
 * v2 기반으로 action 들에 키 부여
 * 좀 더 추상화 가능해 보임
 */
export const createDataHandlers = <K extends DuplexKeysType>() => ({
	dataOn: on<DuplexDataHandler<K>>,
	dataOnce: once<DuplexDataHandler<K>>,
	dataEmit: emit<DuplexDataHandler<K>>,
	signalOn: on<DuplexSignalHandler<K>>,
	signalOnce: once<DuplexSignalHandler<K>>,
	signalEmit: emit<DuplexSignalHandler<K>>,
})

/** v2 타입 생성 예시 */

export const memoHandlers = createDataHandlers<'memos'>()
export const sectionHandlers = createDataHandlers<'section'>()
sectionHandlers.dataOn('DATA_section', (section) => {
	console.log('DATA_section', section)
})

/**
 * v3는... 아래 느낌으로 생각하고 있는데 ...args 처리가 더 세밀하게 들어가야해서 방법은 아닌 걸로 보임
 * const userSignalEmit2 = (...args: Parameters<typeof userSignalEmit>) => emit<SignalHandler2<'user'>>('SIGNAL_User', ...args)
 */

/** 실행 여부 판단용 */
export const rejectSymbol = Symbol('once reject')

export const rejectCheck = <T>(value: T | typeof rejectSymbol): value is T => {
	return value !== rejectSymbol
}

export const filterEmpty = <T>(value: T | '') => {
	return value === '' ? false : true
}

/** 데이터에 고유 식별 걸어주는게 좋지 않을까 */

// 키벨류 key value

// 같은 이름으로 처리하는게 왜 위험하냐면
// 데이터 전송할 때랑 데이터 요청할 때 키가 같아버리면 양방향에서 데이터 처리가 안됨

/**
 * {prefix}_{Data_Key} , {randomKey}
 * 요청은 시그널로 응답은 data로 시그널로 데이터 요청해서 받는 로직이고
 * random은 일회용 신호를 위해 준비됨
 * 데이터는 입력할 때 {prefix}_{key} 데이터로 보낸다
 * generateRandomText2 쓰지 않는 기본 리스너는 on으로 정의해서 항상 받도록 구성
 */

// const text1 = '\u27C5'
// const text2 = '\u27C6'
export const prefix = {
	/** 데이터 요청
	 * 받는 곳에서 똑같이 처리해주면 됨
	 */
	signal: 'SIGNAL_',
	/** 데이터 응답 */
	data: 'DATA_',
	memo: 'MEMO_',
	user: 'USER_',
	component: 'COMPONENT_',

	pub: 'PUB_',
} as const

export const constant = {
	allUser: '⟅ALL_USER⟆',
	sectionList: '⟅SECTION_LIST⟆',
	memoList: '⟅MEMO_LIST⟆',
	currentSection: '⟅CURRENT_SECTION⟆',
	category: '⟅CATEGORY⟆',
	alias: '⟅ALIAS⟆',
	pub: '⟅PUB⟆',
}

export const splitSymbol = '⁑'
export const selectedType = 'SELECTED'

/**
 * 일회용 호출
 * 저장하는 adapter main에는 adapter 만 넣어야 함
 * 호출 키랑 응답 값이 다름
 * 호출 어뎁터랑 응답 어뎁터가 달라서 식별자 정의 해야함
 * asyncEmit<UserDuplex>('user')
 */

/**
 * asyncEmit('user')
 * @param handlerKey
 * @param delay
 * @returns
 */
export const asyncEmit = <T extends DuplexKeysType>(handlerKey: T, delay?: number) =>
	new Promise<DynamicDuplexType<T>['data'] | typeof rejectSymbol>((resolve, reject) => {
		const random = generateRandomText2()
		const signalKey = prefix['signal'] + handlerKey
		const dataKey = prefix['data'] + handlerKey
		const delay2 = delay ?? 1000
		const event = dataOnce(dataKey + random, (args) => {
			resolve(args)
		})

		signalEmit(signalKey, random)

		setTimeout(() => {
			event()
			reject(rejectSymbol)
		}, delay2)
	})

// enum 키 합성 타입 정의
export type ConcatStrings<A extends string, B extends string> = `${A}${B}`

// duplex 용 enum 키 합성 타입 정의
export type DuplexConcatStrings<A extends (typeof prefix)[keyof typeof prefix], B extends DuplexKeysType> = `${A}${B}`

// 문자열을 합치고 타입을 추론하는 함수
function concatWithType<A extends string, B extends string>(a: A, b: B): ConcatStrings<A, B> {
	return `${a}${b}` as const
}

/**
 * duplex 용 문자열을 합치고 타입을 추론하는 함수
 *  */
export function duplexConcatWithType<A extends (typeof prefix)[keyof typeof prefix], B extends DuplexKeysType>(
	a: A,
	b: B
): ConcatStrings<A, B> {
	return `${a}${b}` as const
}

/**
 * duplex 용 문자열을 합치고 타입을 추론하는 함수
 * 키 타입을 prefix로 넣을 수 있어서 더 편함
 */
export function duplexConcatWithType2<A extends keyof typeof prefix, B extends DuplexKeysType>(
	a: A,
	b: B
): DuplexConcatStrings<(typeof prefix)[A], B> {
	return `${prefix[a]}${b}` as const
}
