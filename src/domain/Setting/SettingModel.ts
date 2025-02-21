import { emit, on } from '@create-figma-plugin/utilities'
import { SET_DOMAIN_PAIR, GET_DOMAIN_PAIR, STORE_KEY } from '../constant'
import { getRootStore, setRootStore } from '../utils/getStore'

export type DomainSettingType = {
	domainId: number
	domain: string
	language_codes: string[]
}

export const onGetDomainSetting = () => {
	on(GET_DOMAIN_PAIR.REQUEST_KEY, () => {
		const domainSetting = getRootStore<DomainSettingType>(STORE_KEY.DOMAIN)
		if (domainSetting) {
			emit(GET_DOMAIN_PAIR.RESPONSE_KEY, domainSetting)
		}
	})
}

export const onSetDomainSetting = () => {
	on(SET_DOMAIN_PAIR.REQUEST_KEY, (domainSetting: DomainSettingType) => {
		setRootStore(STORE_KEY.DOMAIN, domainSetting)
	})
}
