import { on, once, emit } from '@create-figma-plugin/utilities'

import { FigmaUser } from '../types'

import { createDataHandlers, dataOn, DuplexDataHandler, DuplexSignalHandler, signalReceiving } from '../interface'
import {
	getAllSectionDataModel,
	clearAllSectionListModel,
	setSectionListModel,
	setSectionModel,
	getAllSectionListModel,
	getOneCurrentSelection,
	getCurrentSectionModel,
	setCurrentSectionModel,
} from './sectionRepo'

/** duplex 데이터 전송 핸들러 예시 */
type DataSectionHandler = DuplexDataHandler<'section'>
/** duplex 신호 전송 핸들러 예시 */
type SignalSectionHandler = DuplexSignalHandler<'section'>

export const {
	dataOn: dataOnSection,
	dataOnce: dataOnceSection,
	dataEmit: dataEmitSection,
	signalOn: signalOnSection,
	signalOnce: signalOnceSection,
	signalEmit: signalEmitSection,
} = createDataHandlers<'section'>()
export const {
	dataOn: dataOnList,
	dataOnce: dataOnceList,
	dataEmit: dataEmitList,
	signalOn: signalOnList,
	signalOnce: signalOnceList,
	signalEmit: signalEmitList,
} = createDataHandlers<'sectionList'>()

export const {
	dataOn: dataOnCurrentSection,
	dataOnce: dataOnceCurrentSection,
	dataEmit: dataEmitCurrentSection,
	signalOn: signalOnCurrentSection,
	signalOnce: signalOnceCurrentSection,
	signalEmit: signalEmitCurrentSection,
} = createDataHandlers<'currentSection'>()

// 단순 데이터 처리 이외에 처리 위임 형태를 만드는게 진짜기 때문에 빠르게 작업하고 넘어갈 것

// 섹션은 원하는 위치에 메모데이터를 넣는 역할임

/**
 * main 이벤트 핸들러
 * 저장과 응답 코드 처리
 * 여기도 처리 로직이 비슷함
 * 비교 처리를 모듈로 받아서 처리하면 ui에서 시그널에 위임한 것 처럼 간소화 됨
 * 섹션 정보 핸들링
 */
export const mainSection_Adapter = () => {
	dataOnSection('DATA_section', async (section) => {
		const sectionItems = Object.entries(section)
		for (const [key, value] of sectionItems) {
			setSectionModel(key, value)
		}
		// 변경 사항 전송
		// TODO: 변경 반영 측면에서 좀 애매함
		dataEmitSection('DATA_section', section)
	})
	signalOnSection('SIGNAL_section', async (key) => {
		/** 모델 코드임 */
		// const user = await getUserModel()
		// 전체 섹션 전송하는 게 컨벤션 고로 전부 보냄

		const section = getAllSectionDataModel()
		signalReceiving('section', key)(section)
	})
}

/**
 * 섹션 리스트 정보 핸들링
 */
export const mainSectionList_Adapter = () => {
	dataOnList('DATA_sectionList', async (sectionList) => {
		// 삭제하고 싶으면 key : '' 로 처리
		// 추가나 수정은 값을 넣거나 배열을 넣어서 처리 함
		// 기본적으로 모든 값을 접근해서 수정하지 않음
		// 받은 모든 섹션 저장
		const newSectionList = setSectionListModel(sectionList)
		dataEmitList('DATA_sectionList', newSectionList)
	})
	signalOnList('SIGNAL_sectionList', async (key) => {
		const sectionList = getAllSectionListModel()
		signalReceiving('sectionList', key)(sectionList)
	})
}

export const selectMainCurrentSection_Adapter = () => {
	dataOnCurrentSection('DATA_currentSection', async (currentSection) => {
		// 찾아서 수정함 , 만약 pageId 가 필요하면 수정해야함
		await setCurrentSectionModel(currentSection)
		selectMainCurrentSection()
	})

	signalOnCurrentSection('SIGNAL_currentSection', async () => {
		selectMainCurrentSection()
	})
}

/** 선택 노드 기준 섹션 조회 */
export const selectMainCurrentSection = () => {
	const node = getOneCurrentSelection()
	if (node) {
		const section = getCurrentSectionModel(node)
		if (section) {
			dataEmitCurrentSection('DATA_currentSection', section)
		}
	} else {
		pageMainCurrentSection_Adapter()
	}
}

/** 페이지 이름 기준 섹션 조회 */
export const pageMainCurrentSection_Adapter = () => {
	const page = figma.currentPage
	const section = getCurrentSectionModel(page)
	if (section) {
		dataEmitCurrentSection('DATA_currentSection', section)
	}
}
