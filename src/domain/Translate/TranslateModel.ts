import { emit, on } from '@create-figma-plugin/utilities'
import {
	SET_DOMAIN_PAIR,
	GET_DOMAIN_PAIR,
	STORE_KEY,
	GET_LANGUAGE_CODES,
	SET_LANGUAGE_CODES,
	CHANGE_LANGUAGE_CODE,
	CURRENT_SECTION_SELECTED,
	NODE_STORE_KEY,
} from '../constant'
import { getFigmaRootStore, setFigmaRootStore } from '../utils/getStore'
import { signal } from '@preact/signals-core'
import { getNodeData, LocalizationTranslationDTO } from '../Label/TextPluginDataModel'
import { fetchDB } from '../utils/fetchDB'
import { textFontLoad } from '@/figmaPluginUtils/text'

/** 현재 섹션이 선택되었는가 여부 판단 */
export const currentSectionSignal = signal<string | null>(null)

export const onCurrentSectionSelectedResponse = () => {
	emit(CURRENT_SECTION_SELECTED.REQUEST_KEY)
	return on(CURRENT_SECTION_SELECTED.RESPONSE_KEY, (sectionId: string) => {
		currentSectionSignal.value = sectionId
	})
}

export const getCurrentSectionSelected = (node: BaseNode) => {
	if (node && node.type === 'SECTION') {
		return node.id
	}
	return null
}
export const onCurrentSectionSelected = () => {
	on(CURRENT_SECTION_SELECTED.REQUEST_KEY, () => {
		const sectionId = getCurrentSectionSelected(figma.currentPage.selection[0])
		if (sectionId) {
			emit(CURRENT_SECTION_SELECTED.RESPONSE_KEY, sectionId)
		}
	})
}

export const searchTranslationCode = async (key: string, code: string) => {
	const result = await fetchDB(
		('/localization/translations/search?keyId=' + key + '&language=' + code) as '/localization/translations/search',
		{
			method: 'GET',
		}
	)

	if (!result || result.status !== 200) {
		return
	}

	const data = (await result.json()) as LocalizationTranslationDTO

	return data
}

export const changeLocalizationCode = async (sectionNode: SectionNode, code: string) => {
	figma.skipInvisibleInstanceChildren = true

	const arr = sectionNode.findAllWithCriteria({
		types: ['TEXT'],
		pluginData: {
			keys: [NODE_STORE_KEY.LOCALIZATION_KEY],
		},
	})

	const targetOrigin = new Map<string, Set<TextNode>>()

	//  map 말고 foreach 해도 될지도?
	/**
	 * 현재 로컬라이제이션 키가 같은 노드들을 모아서 처리
	 */
	const targetTextArr = arr

		.filter((item) => {
			const currentLocalizationKey = item.getPluginData(NODE_STORE_KEY.LOCALIZATION_KEY)
			if (currentLocalizationKey) {
				return true
			}
			return false
		})
		.map((item) => {
			const localizationKey = item.getPluginData(NODE_STORE_KEY.LOCALIZATION_KEY)

			if (localizationKey !== '') {
				let temp = targetOrigin.get(localizationKey)
				if (temp == null) {
					temp = new Set<TextNode>()
				}

				targetOrigin.set(localizationKey, temp.add(item))
			}
			return item
		})

	const now = Date.now()
	for (const [key, targetNode] of targetOrigin.entries()) {
		// key , code

		const a = await searchTranslationCode(key, code)

		if (a) {
			console.log('🚀 ~ changeLocalizationCode ~ a:', a)

			for (const node of targetNode) {
				await textFontLoad(node)
				node.characters = a.text
			}
		}
	}
}

/** 번역을 위한 언어 코드 설정 */
export const onSetLanguageCode = () => {
	on(CHANGE_LANGUAGE_CODE.REQUEST_KEY, async (languageCode: string) => {
		const sectionNode = figma.currentPage.selection[0]
		if (sectionNode.type === 'SECTION') {
			await changeLocalizationCode(sectionNode, languageCode)
		}
	})
}
