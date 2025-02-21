// 최초 접속 시 유저를 등록할 때 펍도 같이 생성
// 메모 업데이트 시 전체 유저에게 업데이트 된 메모 리스트를 펍에 추가
// 전체 메모를 받을 경우 자신의 펍 데이터 삭제
// 카테고리 수정 등 인터렉션이 발생할 때 펍 데이터를 확인해서 업데이트된 데이터 전송 받고 펍 삭제

import { EventHandler, on } from '@create-figma-plugin/utilities'
import { DynamicDuplexType, DuplexKeysType } from '../duplex'
import {
	ConcatStrings,
	DataHandlerV2,
	dataOn,
	DuplexConcatStrings,
	SignalHandlerV2,
	signalReceiving,
} from '../interface'
import { Pub } from '../types'
import { getCurrentPub, mainPubSignal, pubCheck, pubClear } from './sysyemRepo'

// 딱히 저장돠는 건 없고 처리로직이 필요한 상태

type PubDataHandler = DataHandlerV2<'pub', Pub>
type PubSignalSHandler = SignalHandlerV2<'pub'>

export const mainPub_Adapter = () => {
	on<PubSignalSHandler>('SIGNAL_pub', async (key) => {
		const pub = await getCurrentPub()
		console.log('SIGNAL_pub', pub)
		if (pubCheck(pub)) {
			mainPubSignal(pub)
			pubClear()
		}
	})
}
