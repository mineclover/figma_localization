import { on, once, emit } from '@create-figma-plugin/utilities'

import { createDataHandlers, dataOn, DuplexDataHandler, DuplexSignalHandler, signalReceiving } from '../interface'
import { getAllUser, getUserModel, setUserName } from './userRepo'

/** duplex 데이터 전송 핸들러 예시 */
type DataUserHandler = DuplexDataHandler<'user'>
/** duplex 신호 전송 핸들러 예시 */
type SignalUserHandler = DuplexSignalHandler<'user'>

export const {
	dataOn: dataUserOn,
	dataOnce: dataUserOnce,
	dataEmit: dataUserEmit,
	signalOn: signalUserOn,
	signalOnce: signalUserOnce,
	signalEmit: signalUserEmit,
} = createDataHandlers<'user'>()

export const {
	dataOn: dataAllUserOn,
	dataOnce: dataAllUserOnce,
	dataEmit: dataAllUserEmit,
	signalOn: signalAllUserOn,
	signalOnce: signalAllUserOnce,
	signalEmit: signalAllUserEmit,
} = createDataHandlers<'allUser'>()

// 단순 데이터 처리 이외에 처리 위임 형태를 만드는게 진짜기 때문에 빠르게 작업하고 넘어갈 것
/**
 * main 이벤트 핸들러
 * 저장과 응답 코드 처리
 * 여기도 처리 로직이 비슷함
 * 비교 처리를 모듈로 받아서 처리하면 ui에서 시그널에 위임한 것 처럼 간소됨
 */
export const mainUser_Adapter = () => {
	dataUserOn('DATA_user', async (user) => {
		const originUser = await getUserModel()
		// 변경 시 전송
		if (originUser.name !== user.name) {
			/** 저장하는 모델 코드임 */
			setUserName(user.name)
			/** 동기화 처리 */

			dataUserEmit('DATA_user', {
				uuid: user.uuid,
				name: user.name,
			})
		}
	})
	on<SignalUserHandler>('SIGNAL_user', async (key) => {
		/** 모델 코드임 */
		const user = await getUserModel()
		/** 키  여부에 따른 응답 처리 추상화 */
		signalReceiving('user', key)(user)
	})
}

export const allUser_Adapter = () => {
	signalAllUserOn('SIGNAL_allUser', async (key) => {
		signalReceiving('allUser', key)(getAllUser())
	})
}

export const sampleDataEmit = emit<DuplexDataHandler<'user'>>
