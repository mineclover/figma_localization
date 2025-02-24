import { on, once, showUI } from '@create-figma-plugin/utilities'
import { CloseHandler, ResizeWindowHandler } from '../figmaPluginUtils/types'

import { nodeZoom_Adapter } from '@/figmaPluginUtils/utilAdapter'
import {
	onGetDomainSetting,
	onGetLanguageCodes,
	onSetDomainSetting,
	onSetLanguageCodes,
} from '@/domain/Setting/SettingModel'
import { onGetCursorPosition, onGetProjectId, onSetProjectId } from '@/domain/Label/LabelModel'

export default function () {
	// 세팅
	onSetProjectId()
	onGetProjectId()

	onGetDomainSetting()
	onSetDomainSetting()
	onGetLanguageCodes()
	onSetLanguageCodes()
	onGetCursorPosition()

	// 유틸
	nodeZoom_Adapter()

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
