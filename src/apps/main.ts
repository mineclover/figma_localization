import { on, once, showUI } from '@create-figma-plugin/utilities'
import { CloseHandler, ResizeWindowHandler } from '../figmaPluginUtils/types'
import { allUser_Adapter, mainUser_Adapter } from '@/domain/user/userAdapter'
import {
	mainSectionList_Adapter,
	pageMainCurrentSection_Adapter,
	selectMainCurrentSection,
	selectMainCurrentSection_Adapter,
	signalOnSection,
	signalOnCurrentSection,
} from '@/domain/section/sectionAdapter'
import { FilePathNodeSearch, FilePathSearch, linkPathNodeType } from '@/figmaPluginUtils'
import { CurrentSectionInfo } from '@/domain/types'
import { mainCategory_Adapter } from '@/domain/category/categoryAdapter'
import { mainMemo_Adapter } from '@/domain/memo/memoAdapter'
import { mainPub_Adapter } from '@/domain/system/systemAdapter'
import { nodeZoom_Adapter } from '@/figmaPluginUtils/utilAdapter'

export default function () {
	mainUser_Adapter()
	allUser_Adapter()
	mainMemo_Adapter()
	mainSectionList_Adapter()
	mainCategory_Adapter()
	selectMainCurrentSection_Adapter()
	mainPub_Adapter()
	//on 이벤트들은 중첩 됨

	// 유틸
	nodeZoom_Adapter()

	// 임시

	signalOnCurrentSection('SIGNAL_currentSection', (key) => {
		//임시 처리
		// SIGNAL_currentSection는 이벤트로 보내다보니... 시그널로 처리할게 딱히 없음
		console.log('SIGNAL_currentSection', key)
	})

	signalOnSection('SIGNAL_section', (key) => {
		// 받는 값 없어서
		//임시 처리

		console.log('SIGNAL_section', key)
	})

	figma.on('selectionchange', function () {
		selectMainCurrentSection()
	})

	figma.on('currentpagechange', function () {
		// 페이지 이름 기준 섹션 리스트 조회
		// 키 조회는 섹션 이름 기준 startWith 로 하위 대상을 섹션 리스트에서 선택해서 조회함
		pageMainCurrentSection_Adapter()
	})

	// 페이지에 고유 이름 부여 ( 섹션 키 조회 시 페이지 이름을 대체하기 위함 )

	on<ResizeWindowHandler>('RESIZE_WINDOW', function (windowSize: { width: number; height: number }) {
		const { width, height } = windowSize
		figma.ui.resize(width, height)
	})

	once<CloseHandler>('CLOSE', function () {
		figma.closePlugin()
	})
	showUI({
		height: 500,
		width: 300,
	})
}
