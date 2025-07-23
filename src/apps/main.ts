import { on, once, showUI } from '@create-figma-plugin/utilities';
import { CloseHandler, ResizeWindowHandler } from '../figmaPluginUtils/types';

import { nodeZoom_Adapter, pageNodeZoom_Adapter, pageSelectIds_Adapter } from '@/figmaPluginUtils/utilAdapter';
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
} from '@/domain/Setting/SettingModel';
import { onGetProjectId, onSetNodeAction, onSetProjectId } from '@/domain/Label/LabelModel';
import { onNodeSelectionChange, onStyleChange } from '@/model/on/onChanges';
import { onGetCursorPosition } from '@/model/on/GET_CURSOR_POSITION';
import { onGetLocalizationKeyData } from '@/model/on/GET_LOCALIZATION_KEY_VALUE';
import {
	onNodeReload,
	onPutLocalizationKey,
	onSetNodeResetKey,
	onTargetSetNodeLocation,
	onUpdateNodeStoreBatchKey,
} from '@/domain/Label/TextPluginDataModel';
import {
	onClearVariableData,
	onCurrentSectionSelected,
	onGetVariableData,
	onSetLanguageCode,
	onSetVariableData,
} from '@/domain/Translate/TranslateModel';
import {
	onPatternMatch,
	onSetNodeIgnore,
	onSetNodeLocalizationKeyBatch,
	onUpdateNodeLocalizationKeyBatch,
} from '@/domain/Batch/batchModel';
import { onDownloadStyle, onSetStyle } from '@/domain/Style/styleModel';
import { onGetKeyTranslations } from '@/model/on/GET_TRANSLATION_KEY_VALUE';
import { onGetStyleData, onGetStyleDataResponse } from '@/model/on/GET_STYLE_DATA';
import { onSetPageLockOpen } from '@/domain/System/lock';
import { runExample } from '@/utils/test';
import {
	onAutoSelectModeRequest,
	onBaseKeyInjection,
	onBaseUpdate,
	onDisableRender,
	onRender,
	onSelectModeMain,
} from '@/domain/Search/visualModel';
import {
	onTextToFrameSelect,
	onTranslationActionRequest,
	onTranslationActionResponse,
} from '@/domain/Search/locations';

function initializeSettings() {
	onSetProjectId();
	onGetProjectId();
	onGetDomainSetting();
	onSetDomainSetting();
	onGetLanguageCodes();
	onSetLanguageCodes();
	onSetApiKey();
	onGetApiKey();
	onGetUserHash();
	onSetUserHash();
}

function initializePluginData() {
	onTargetSetNodeLocation();
	onNodeReload();
	onSetNodeResetKey();
	onGetKeyTranslations();
	onGetLocalizationKeyData();
	onPutLocalizationKey();
	onSetLanguageCode();
}

function initializeBatchOperations() {
	onPatternMatch();
	onSetNodeLocalizationKeyBatch();
	onUpdateNodeStoreBatchKey();
	onUpdateNodeLocalizationKeyBatch();
	onSetNodeIgnore();
}

function initializeStyleAndVariables() {
	onSetStyle();
	onDownloadStyle();
	onGetStyleData();
	onStyleChange();
	onGetVariableData();
	onSetVariableData();
	onClearVariableData();
}

function initializeViewportAndSelection() {
	onNodeSelectionChange();
	nodeZoom_Adapter();
	pageNodeZoom_Adapter();
	pageSelectIds_Adapter();
	onCurrentSectionSelected();
	onSetNodeAction();
	onGetCursorPosition();
}

function initializeVisualizationMode() {
	onRender();
	onDisableRender();
	onSelectModeMain();
	onBaseUpdate();
	onBaseKeyInjection();
	onAutoSelectModeRequest();
}

function initializeTranslationActions() {
	onTranslationActionRequest();
	onTextToFrameSelect();
}

function initializeSystemFeatures() {
	onSetPageLockOpen();
}

function initializeUIHandlers() {
	on<ResizeWindowHandler>('RESIZE_WINDOW', function (windowSize: { width: number; height: number }) {
		const { width, height } = windowSize;
		figma.ui.resize(width, height);
	});

	once<CloseHandler>('CLOSE', function () {
		figma.closePlugin();
	});
}

export default function () {
	initializeSettings();
	initializePluginData();
	initializeBatchOperations();
	initializeStyleAndVariables();
	initializeViewportAndSelection();
	initializeVisualizationMode();
	initializeTranslationActions();
	initializeSystemFeatures();
	initializeUIHandlers();

	showUI({
		height: 500,
		width: 330,
	});
}
