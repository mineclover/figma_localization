import { on, once, showUI } from '@create-figma-plugin/utilities'
import { CloseHandler, ResizeWindowHandler } from '../figmaPluginUtils/types'

import { nodeZoom_Adapter, pageNodeZoom_Adapter, pageSelectIds_Adapter } from '@/figmaPluginUtils/utilAdapter'
import {
	onGetDomainSetting,
	onGetLanguageCodes,
	onSetDomainSetting,
	onSetLanguageCodes,
} from '@/domain/Setting/SettingModel'
import { onGetCursorPosition, onGetProjectId, onNodeSelectionChange, onSetProjectId } from '@/domain/Label/LabelModel'
import {
	onGetKeyTranslations,
	onGetLocalizationKeyData,
	onNodeReload,
	onPutLocalizationKey,
	onSetNodeResetKey,
	onTargetSetNodeLocation,
	onUpdateNodeStoreKey,
} from '@/domain/Label/TextPluginDataModel'
import { onCurrentSectionSelected, onSetLanguageCode } from '@/domain/Translate/TranslateModel'
import { onPatternMatch, onSetNodeLocalizationKeyBatch } from '@/domain/Batch/batchModel'

export default function () {
	// 세팅
	onSetProjectId()
	onGetProjectId()

	onGetDomainSetting()
	onSetDomainSetting()
	onGetLanguageCodes()
	onSetLanguageCodes()
	onGetCursorPosition()
	// 플러그인 데이터 세팅

	onTargetSetNodeLocation()
	onNodeReload()
	onSetNodeResetKey()
	onGetKeyTranslations()
	onGetLocalizationKeyData()
	onPutLocalizationKey()
	onUpdateNodeStoreKey()
	onSetLanguageCode()
	onPatternMatch()
	onSetNodeLocalizationKeyBatch()
	// 유틸
	onNodeSelectionChange()
	nodeZoom_Adapter()
	pageNodeZoom_Adapter()
	pageSelectIds_Adapter()
	onCurrentSectionSelected()

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
		width: 330,
	})
}
