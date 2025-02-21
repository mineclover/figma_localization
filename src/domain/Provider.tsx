import { ComponentChildren, Fragment, h } from 'preact'
import { useLayoutEffect } from 'preact/hooks'
import ClientModalProvider from '@/components/modal/Modal'

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
			// uiDuplexEmit('user'),
			// DuplexEmit('memos') >> clientMemoEmit 로 대체,
		]

		return () => {
			// events.forEach((event) => event())
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
