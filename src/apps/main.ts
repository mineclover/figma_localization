import { on, once, showUI } from '@create-figma-plugin/utilities';
import { CloseHandler, ResizeWindowHandler } from '../figmaPluginUtils/types';

import { nodeZoom_Adapter, pageNodeZoom_Adapter, pageSelectIds_Adapter } from '@/figmaPluginUtils/utilAdapter';
import {
	onGetDomainSetting,
	onGetLanguageCodes,
	onGetUserHash,
	onGetUserHashResponse,
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
import { onDisableRender, onRender } from '@/domain/Search/visualModel';

export default function () {
	// 세팅
	onSetProjectId();
	onGetProjectId();

	onGetDomainSetting();
	onSetDomainSetting();
	onGetLanguageCodes();
	onSetLanguageCodes();
	onGetCursorPosition();
	// 플러그인 데이터 세팅

	onTargetSetNodeLocation();
	onNodeReload();
	onSetNodeResetKey();
	onGetKeyTranslations();
	onGetLocalizationKeyData();
	onPutLocalizationKey();

	onSetLanguageCode();
	onPatternMatch();

	onSetNodeLocalizationKeyBatch();
	onUpdateNodeStoreBatchKey();
	onUpdateNodeLocalizationKeyBatch();
	onSetNodeIgnore();
	onSetStyle();
	onDownloadStyle();
	onGetVariableData();
	onSetVariableData();
	onClearVariableData();

	onSetPageLockOpen();
	// 유틸
	onNodeSelectionChange();
	nodeZoom_Adapter();
	pageNodeZoom_Adapter();
	pageSelectIds_Adapter();
	onCurrentSectionSelected();
	onSetNodeAction();
	// 페이지에 고유 이름 부여 ( 섹션 키 조회 시 페이지 이름을 대체하기 위함 )
	onStyleChange();
	onGetStyleData();
	// runExample();
	onGetUserHash();
	onSetUserHash();
	onRender();
	onDisableRender();

	on<ResizeWindowHandler>('RESIZE_WINDOW', function (windowSize: { width: number; height: number }) {
		const { width, height } = windowSize;
		figma.ui.resize(width, height);
	});

	once<CloseHandler>('CLOSE', function () {
		figma.closePlugin();
	});
	showUI({
		height: 500,
		width: 330,
	});
}
