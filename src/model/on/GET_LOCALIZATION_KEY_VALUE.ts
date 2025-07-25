import { emit, on } from '@create-figma-plugin/utilities'
import { GET_LOCALIZATION_KEY_VALUE } from '../../domain/constant'
import { processTextNodeLocalization } from '../../domain/Label/TextPluginDataModel'
import { localizationKeySignal } from '../signal'

/** 키 데이터 조회 */
export const onGetLocalizationKeyData = () => {
	on(GET_LOCALIZATION_KEY_VALUE.REQUEST_KEY, async () => {
		const node = figma.currentPage.selection[0]
		const value = await processTextNodeLocalization(node)
		emit(GET_LOCALIZATION_KEY_VALUE.RESPONSE_KEY, value)
	})
}

/** UI에서 키 데이터 응답 수신 처리 */
export const onGetLocalizationKeyResponse = () => {
	emit(GET_LOCALIZATION_KEY_VALUE.REQUEST_KEY)
	return on(GET_LOCALIZATION_KEY_VALUE.RESPONSE_KEY, data => {
		localizationKeySignal.value = data
	})
}
