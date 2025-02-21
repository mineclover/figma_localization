import { ComponentChildren, Fragment, h } from 'preact'
import { duplexKeysAndSignal, DuplexKeysType } from './duplex'
import { useLayoutEffect } from 'preact/hooks'
import { duplexConcatWithType2, dataOn, signalEmit, constant } from './interface'
import ClientModalProvider from '@/components/modal/Modal'
import { clientMemoEmit } from './memo/memoRepo'

/**
 * ui
 * 이펙트에 데이터 등록 간소화
 * 등록할 키 리스트로 리스트 생성해서 반복 처리
 */
export const uiDuplexEmit = <T extends DuplexKeysType>(handlerKey: T) => {
	const signalKey = duplexConcatWithType2('signal', handlerKey)
	const dataKey = duplexConcatWithType2('data', handlerKey)

	const event = dataOn(dataKey, (args) => {
		duplexKeysAndSignal[handlerKey].value = args
	})

	signalEmit(signalKey)
	return event
}

/**
 * duplex 전용 어댑터
 * ui쪽 만든 어뎁터 쉽게 등록 가능
 * @param param0
 * @returns
 */
export const Duplex_Adapter = ({ children }: { children: ComponentChildren }) => {
	useLayoutEffect(() => {
		// 항상 열려있는 인터페이스
		// 공식 루트
		const events = [
			uiDuplexEmit('user'),
			uiDuplexEmit('allUser'),
			uiDuplexEmit('section'),
			uiDuplexEmit('sectionList'),
			uiDuplexEmit('currentSection'),
			uiDuplexEmit('category'),
			// DuplexEmit('memos') >> clientMemoEmit 로 대체,
			clientMemoEmit(),
		]

		return () => {
			events.forEach((event) => event())
		}
	}, [])

	return <Fragment>{children}</Fragment>
}

/**
 * 최종 provider
 * @param param0
 * @returns
 */
export function AppProvider({ children }: { children: preact.ComponentChildren }) {
	// 사용자 상태
	return (
		<Duplex_Adapter>
			{children}
			<ClientModalProvider></ClientModalProvider>
		</Duplex_Adapter>
	)
}
