import { on, once, showUI } from '@create-figma-plugin/utilities'
import {
	onPatternMatch,
	onSetNodeIgnore,
	onSetNodeLocalizationKeyBatch,
	onUpdateNodeLocalizationKeyBatch,
} from '@/domain/Batch/batchModel'
import { onGetProjectId, onSetNodeAction, onSetProjectId, onTargetSetNodeAction } from '@/domain/Label/LabelModel'
import {
	onNodeReload,
	onPutLocalizationKey,
	onSetNodeResetKey,
	onTargetSetNodeLocation,
	onUpdateNodeStoreBatchKey,
} from '@/domain/Label/TextPluginDataModel'
import {
	onGetBaseNode,
	onTextToFrameSelect,
	onTranslationActionRequest,
	onTranslationActionResponse,
} from '@/domain/Search/locations'
import { onSyncGetNodeData } from '@/domain/Search/searchModel'
import {
	onAutoSelectModeRequest,
	onBaseKeyInjection,
	onBaseUpdate,
	onDisableRender,
	onGetBaseNode2,
	onRender,
	onSelectModeMain,
} from '@/domain/Search/visualModel'
import {
	onGetApiKey,
	onGetDomainSetting,
	onGetLanguageCodes,
	onGetUserHash,
	onGetUserHashResponse,
	onSetApiKey,
	onSetDomainSetting,
	onSetLanguageCodes,
	onSetUserHash,
} from '@/domain/Setting/SettingModel'
import { onDownloadStyle, onSetStyle } from '@/domain/Style/styleModel'
import { onSetPageLockOpen } from '@/domain/System/lock'
import { PatternMatchTaskExecutor } from '@/domain/Task/PatternMatchTaskExecutor'
import { TaskProcessor } from '@/domain/Task/taskProcessor'
import {
	onClearVariableData,
	onCurrentSectionSelected,
	onGetVariableData,
	onSetLanguageCode,
	onSetVariableData,
} from '@/domain/Translate/TranslateModel'
import { nodeZoom_Adapter, pageNodeZoom_Adapter, pageSelectIds_Adapter } from '@/figmaPluginUtils/utilAdapter'
import { onGetCursorPosition } from '@/model/on/GET_CURSOR_POSITION'
import { onGetLocalizationKeyData } from '@/model/on/GET_LOCALIZATION_KEY_VALUE'
import { onGetStyleData, onGetStyleDataResponse, onSyncGetStyleData } from '@/model/on/GET_STYLE_DATA'
import { onGetKeyTranslations } from '@/model/on/GET_TRANSLATION_KEY_VALUE'
import { onNodeSelectionChange, onStyleChange } from '@/model/on/onChanges'
import { runExample } from '@/utils/test'
import type { CloseHandler, ResizeWindowHandler } from '../figmaPluginUtils/types'

function initializeSettings() {
	onSetProjectId()
	onGetProjectId()
	onGetDomainSetting()
	onSetDomainSetting()
	onGetLanguageCodes()
	onSetLanguageCodes()
	onSetApiKey()
	onGetApiKey()
	onGetUserHash()
	onSetUserHash()
}

function initializePluginData() {
	onTargetSetNodeLocation()
	onNodeReload()
	onSetNodeResetKey()
	onGetKeyTranslations()
	onGetLocalizationKeyData()
	onPutLocalizationKey()
	onSetLanguageCode()
}

function initializeBatchOperations() {
	onPatternMatch()
	onSetNodeLocalizationKeyBatch()
	onUpdateNodeStoreBatchKey()
	onUpdateNodeLocalizationKeyBatch()
	onSetNodeIgnore()
}

function initializeStyleAndVariables() {
	onSetStyle()
	onDownloadStyle()
	onGetStyleData()
	onSyncGetStyleData()
	onSyncGetNodeData()
	onStyleChange()
	onGetVariableData()
	onSetVariableData()
	onClearVariableData()
}

function initializeViewportAndSelection() {
	onNodeSelectionChange()
	nodeZoom_Adapter()
	pageNodeZoom_Adapter()
	pageSelectIds_Adapter()
	onCurrentSectionSelected()
	onSetNodeAction()
	onTargetSetNodeAction()
	onGetCursorPosition()
	onGetBaseNode2()
}

function initializeVisualizationMode() {
	onRender()
	onDisableRender()
	onSelectModeMain()
	onBaseUpdate()
	onBaseKeyInjection()
	onAutoSelectModeRequest()
}

function initializeTranslationActions() {
	onTranslationActionRequest()
	onTextToFrameSelect()
}

function initializeSystemFeatures() {
	onSetPageLockOpen()
}

function initializeUIHandlers() {
	on<ResizeWindowHandler>('RESIZE_WINDOW', (windowSize: { width: number; height: number }) => {
		const { width, height } = windowSize
		figma.ui.resize(width, height)
	})

	once<CloseHandler>('CLOSE', () => {
		figma.closePlugin()
	})
}

export default function () {
	initializeSettings()
	initializePluginData()
	initializeBatchOperations()
	initializeStyleAndVariables()
	initializeViewportAndSelection()
	initializeVisualizationMode()
	initializeTranslationActions()
	initializeSystemFeatures()

	initializeUIHandlers()

	showUI({
		height: 500,
		width: 330,
	})
}
