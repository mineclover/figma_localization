import { on, once, emit } from '@create-figma-plugin/utilities'

import { FigmaUser, Section, SectionList } from '../types'

import {
	createDataHandlers,
	dataOn,
	DuplexDataHandler,
	DuplexSignalHandler,
	filterEmpty,
	signalReceiving,
} from '../interface'
import { getAllMemoListDataModel, getMemoModel, memoCheck, setMemoModel } from './memoRepo'

/** duplex 데이터 전송 핸들러 예시 */
type DataMemoHandler = DuplexDataHandler<'memos'>
/** duplex 신호 전송 핸들러 예시 */
type SignalMemoHandler = DuplexSignalHandler<'memos'>

export const {
	dataOn: dataMemosOn,
	dataOnce: dataMemosOnce,
	dataEmit: dataMemosEmit,
	signalOn: signalMemosOn,
	signalOnce: signalMemosOnce,
	signalEmit: signalMemosEmit,
} = createDataHandlers<'memos'>()
export const {
	dataOn: dataMemoOn,
	dataOnce: dataMemoOnce,
	dataEmit: dataMemoEmit,
	signalOn: signalMemoOn,
	signalOnce: signalMemoOnce,
	signalEmit: signalMemoEmit,
} = createDataHandlers<'memo'>()

export const {
	dataOn: dataSectionOn,
	dataOnce: dataSectionOnce,
	dataEmit: dataSectionEmit,
	signalOn: signalSectionOn,
	signalOnce: signalSectionOnce,
	signalEmit: signalSectionEmit,
} = createDataHandlers<'section'>()

// 단순 데이터 처리 이외에 처리 위임 형태를 만드는게 진짜기 때문에 빠르게 작업하고 넘어갈 것

// 섹션은 원하는 위치에 메모데이터를 넣는 역할임

/**
 * main 이벤트 핸들러
 * 저장과 응답 코드 처리
 * 여기도 처리 로직이 비슷함
 * 비교 처리를 모듈로 받아서 처리하면 ui에서 시그널에 위임한 것 처럼 간소됨
 */
export const mainMemo_Adapter = () => {
	dataMemosOn('DATA_memos', async (memos) => {
		// 수정: 넘어온 리스트 값들은 전체 수정
		// 삭제: 만약 키만 넘어온다면 제거로 취급할 수 있는가 > 가능
		// {key: memo.key} 로 넘어오면 제거로 취급할 수 있는가 > 가능
		console.log('mainMemo_Adapter', memos)
		const memoList = Object.entries(memos)
		// 메모 데이터 저장

		for (const [key, memo] of memoList) {
			setMemoModel(key, memo)
		}

		// 제거 섹션 제외 데이터 전송?
		// 만약 뭔가 지운다면 그게 ui도 적용되야하니 그대로 전송하는게 맞는 듯
		// const newMemos = Object.fromEntries(memoList.filter(([key, memo]) => memoCheck(memo)))
		// 이벤트 발생 위치랑 다르다고 판단하고 적용함
		// 수정된 대상 전달
		dataMemosEmit('DATA_memos', memos)
		// 전체 데이터를 전송하지 않음
		// 다른 유저의 업데이트를 전송하지 않음 ( 새로고침은 있음 )
	})
	// 전체 메모를 보낼 수 있긴 한데 안쓰는게 좋긴 함
	signalMemosOn('SIGNAL_memos', async (key) => {
		// 아니면 그냥 일회용 프로토콜이면서 동시에 고유식별 인걸로해서 역할을 두개 부여...
		// 어짜피 메모 리스트 호출은 섹션 기반으로 동작
		// 개별 메모 조회에 대한 액션으로 정의함
		// 일단 전체 데이터 전송
		const memos = getAllMemoListDataModel()
		signalReceiving('memos', key)(memos)

		/** 모델 코드임 */
		// const user = await getUserModel()
		// /** 키가 null 인지 여부에 따른 응답 처리 추상화 */
		// signalReceiving('user', key)(user)
	})
	// 단일 메모 조회? 인데 컨벤션에는 이런 기능이 없음
}

/**
 * 추가 기능으로 구현
 */
export const selectMemo_Adapter = () => {
	// 별도의 핸들러 넣어서 구성하라는 뜻

	dataOn('SIGNAL_memo', async (key) => {
		// 이건 인터페이스를 바꿔야할거같은데
		// 아니면 그냥 일회용 프로토콜이면서 동시에 고유식별 인걸로해서 역할을 두개 부여...
		// 어짜피 메모 리스트 호출은 섹션 기반으로 동작
		// 개별 메모 조회에 대한 액션으로 정의함
		if (key == null) {
			return
		}
		const memo = getMemoModel(key)
		if (memo === '') {
			return
		}
		// 메모 하나만 전송하는 것이 컨벤션
		// 메뉴 리스트에 반영되게 해줄 것임
		signalReceiving('memos', key)({ [key]: memo })

		/** 모델 코드임 */
		// const user = await getUserModel()
		// /** 키가 null 인지 여부에 따른 응답 처리 추상화 */
		// signalReceiving('user', key)(user)
	})
}
