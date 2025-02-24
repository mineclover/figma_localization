import { emit, on } from '@create-figma-plugin/utilities'
import { SET_DOMAIN_PAIR, GET_DOMAIN_PAIR, STORE_KEY, GET_LANGUAGE_CODES, SET_LANGUAGE_CODES } from '../constant'
import { getFigmaRootStore, setFigmaRootStore } from '../utils/getStore'
import { signal } from '@preact/signals-core'

export type DomainSettingType = {
	domainId: number
	domain: string
}

export const domainSettingSignal = signal<DomainSettingType | null>(null)

export const languageCodesSignal = signal<string[]>([])

/** Main */
export const onGetDomainSetting = () => {
	on(GET_DOMAIN_PAIR.REQUEST_KEY, () => {
		const domainSetting = getFigmaRootStore<DomainSettingType>(STORE_KEY.DOMAIN)
		if (domainSetting) {
			emit(GET_DOMAIN_PAIR.RESPONSE_KEY, domainSetting)
		}
	})
}

/** UI */
export const onGetDomainSettingResponse = () => {
	emit(GET_DOMAIN_PAIR.REQUEST_KEY)
	return on(GET_DOMAIN_PAIR.RESPONSE_KEY, (domainSetting: DomainSettingType) => {
		domainSettingSignal.value = domainSetting
	})
}

export const onSetDomainSetting = () => {
	on(SET_DOMAIN_PAIR.REQUEST_KEY, (domainSetting: DomainSettingType) => {
		setFigmaRootStore(STORE_KEY.DOMAIN, domainSetting)
		// 그대로 반환
		emit(GET_DOMAIN_PAIR.RESPONSE_KEY, domainSetting)
	})
}

/** Main */
export const onGetLanguageCodes = () => {
	on(GET_LANGUAGE_CODES.REQUEST_KEY, () => {
		const languageCodes = getFigmaRootStore<string[]>(STORE_KEY.LANGUAGE_CODES)
		if (languageCodes) {
			emit(GET_LANGUAGE_CODES.RESPONSE_KEY, languageCodes)
		}
	})
}

/** UI */
export const onGetLanguageCodesResponse = () => {
	emit(GET_LANGUAGE_CODES.REQUEST_KEY)
	return on(GET_LANGUAGE_CODES.RESPONSE_KEY, (languageCodes: string[]) => {
		languageCodesSignal.value = languageCodes
	})
}

export const onSetLanguageCodes = () => {
	on(SET_LANGUAGE_CODES.REQUEST_KEY, (languageCodes: string[]) => {
		setFigmaRootStore(STORE_KEY.LANGUAGE_CODES, languageCodes)
		// 그대로 반환
		emit(GET_LANGUAGE_CODES.RESPONSE_KEY, languageCodes)
	})
}

// 따로 관리
// language_codes: string[]
