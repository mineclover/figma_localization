import { emit } from '@create-figma-plugin/utilities'
import { type ComponentChildren, Fragment, h } from 'preact'
import { useLayoutEffect } from 'preact/hooks'
import ClientModalProvider from '@/components/modal/Modal'
import { onGetCursorPositionResponse } from '@/model/on/GET_CURSOR_POSITION'
import { onGetLocalizationKeyResponse } from '@/model/on/GET_LOCALIZATION_KEY_VALUE'
import { onGetStyleDataResponse } from '@/model/on/GET_STYLE_DATA'
import { onPatternMatchResponse } from './Batch/batchModel'
import { RENDER_PAIR } from './constant'
import { onSetProjectIdResponse } from './Label/LabelModel'
import { onClientLocation } from './Search/clientLocation'
import { onTranslationActionResponse } from './Search/locations'
import {
	onAutoSelectModeResponse,
	onAutoSelectStyleUI,
	onAutoSelectUI,
	onBaseKeySelect,
	onMultiKeySelect,
	onSaveAccept,
	onSectionSelect,
} from './Search/visualModel'
import {
	onGetApiKeyResponse,
	onGetDomainSettingResponse,
	onGetLanguageCodesResponse,
	onGetUserHashResponse,
} from './Setting/SettingModel'
import { onProcessResponse } from './System/process'
import { initializeTaskProcessor } from './Task/taskProcessor'
import { onCurrentSectionSelectedResponse, onGetVariableDataResponse } from './Translate/TranslateModel'

/**
 * duplex 전용 어댑터
 * ui쪽 만든 어뎁터 쉽게 등록 가능
 * @param param0
 * @returns
 */
export const Duplex_Adapter = ({ children }: { children: ComponentChildren }) => {
	useLayoutEffect(() => {
		// 항상 열려있는 인터페이스
		// 공식 루트
		const events = [
			// uiDuplexEmit('user'),
			onGetDomainSettingResponse(),
			onGetLanguageCodesResponse(),
			onGetLocalizationKeyResponse(),
			onGetCursorPositionResponse(),
			onSetProjectIdResponse(),
			onCurrentSectionSelectedResponse(),
			onGetStyleDataResponse(),
			onGetVariableDataResponse(),
			onProcessResponse(),
			onPatternMatchResponse(),
			onGetUserHashResponse(),
			onSectionSelect(),
			onMultiKeySelect(),
			onBaseKeySelect(),
			onSaveAccept(),
			onAutoSelectUI(),
			onAutoSelectStyleUI(),
			onClientLocation(),
			onAutoSelectModeResponse(),
			onGetApiKeyResponse(),
			onTranslationActionResponse(),
		]

		initializeTaskProcessor()
		return () => {
			events.forEach(event => event())
		}
	}, [])

	return <Fragment>{children}</Fragment>
}

/**
 * 최종 provider
 * @param param0
 * @returns
 */
export function AppProvider({ children }: { children: preact.ComponentChildren }) {
	// 사용자 상태
	return (
		<Duplex_Adapter>
			{children}
			<ClientModalProvider></ClientModalProvider>
		</Duplex_Adapter>
	)
}
