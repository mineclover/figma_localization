import { notify } from '@/figmaPluginUtils'
import { setAllStyleRanges, setResetStyle, textFontLoad } from '@/figmaPluginUtils/text'
import type { StyleData } from '@/model/signal'
import { ParsedResourceDTO, type ResourceDTO, type StyleSync } from '@/model/types'
import { applyLocalization, generateXmlString, parseLocalizationVariables } from '@/utils/textTools'
import { parseTextBlock, parseTextBlock2, parseXML } from '@/utils/xml'
import { convertTag, parseXmlToFlatStructure, replaceTagNames, wrapTextWithTag } from '@/utils/xml2'
import { DOWNLOAD_STYLE, NODE_STORE_KEY, VARIABLE_PREFIX } from '../constant'
import { generateLocalizationName, getLocalizationKeyData, getTargetTranslations } from '../Label/TextPluginDataModel'
import { getDomainSetting } from '../Setting/SettingModel'
import type { ActionType } from '../System/ActionResourceDTO'
import { getPageLockOpen } from '../System/lock'
import { searchTranslationCode } from '../Translate/TranslateModel'
import { clientFetchDBCurry, fetchDB } from '../utils/fetchDB'
import { getFigmaRootStore, safeJsonParse } from '../utils/getStore'
import { keyActionFetchCurry, labelKeyMapping } from './actionFetch'
import { createStyleHashId, createStyleSegments, groupAllSegmentsByStyle } from './styleModel'

const _innerTextExtract = (text: any): string => {
	if (typeof text === 'string') {
		return text
	}
	return text[0]['#text']
}

/**
 * target node 스타일을 로컬라이제이션 키 기준으로 업데이트
 * 요청은 date 값으로 캐싱함
 * @param node
 * @param localizationKey
 * @param date Date.now()
 * @returns
 */
export const TargetNodeStyleUpdate = async (node: TextNode, localizationKey: string, code: string, date: number) => {
	const xNodeId = node.id
	const domainSetting = getDomainSetting()

	// TODO: 내부에 도메인 설정 없을 때 널처리 시키려고 둔거 같은데 확장성이 낮아진다고 봄
	if (domainSetting == null) {
		notify('Failed to get domain id', 'error')
		return
	}
	const pageLock = getPageLockOpen()
	if (pageLock === true) {
		notify('Page is locked', 'ok', 1000)
		return
	}

	/** 이름이 없어서 이름 얻는 로직 */
	const originTextResult = await getLocalizationKeyData(localizationKey, date)
	if (originTextResult == null) {
		notify('52 Failed to get localization key data', 'error')
		return
	}
	node.name = generateLocalizationName(originTextResult)
	const NULL_TEXT = 'NULL TEXT'
	/** 클라에서 받는 로컬라이제이션 키로 번역 값들 조회 */
	const targetText = await searchTranslationCode(localizationKey, code, date)
	if (targetText == null) {
		notify('해당 언어에 단어 없음', 'ok')
		return
	}

	// 데이터 처리를 이름 얻기 위해서 로컬 키 얻어서 이름을 얻어오냐
	// 아니면 로컬 키에 소유 번역 키 정보를 같이 담아서 처리 하냐
	// node.name = generateLocalizationName(targetText.text);

	/** a태그 활성화 */
	const wrapText = await wrapTextWithTag(targetText.text)
	/** {변수}를 패턴으로 파싱 */
	const { variables } = parseLocalizationVariables(wrapText)

	/** 변수에 해당하는 값을 플러그인 데이터에서 조회 */
	const variablesKey = Object.values(variables).reduce(
		(acc, item) => {
			const name = item.name.toUpperCase()
			const temp = figma.root.getPluginData(VARIABLE_PREFIX + name) ?? ''
			const changeName = temp === '' ? NULL_TEXT : temp
			if (temp === '') {
				figma.root.setPluginData(VARIABLE_PREFIX + name, NULL_TEXT)
			}
			acc[item.name] = changeName
			return acc
		},
		{} as Record<string, string>
	)

	const fullText = applyLocalization(wrapText, variablesKey)

	const action = (node.getPluginData(NODE_STORE_KEY.ACTION) ?? 'default') as ActionType

	/**
	 * 등록된 번역 값
	 */
	const { xmlString, styleStoreArray, effectStyle, rowText } = await xmlToStyle(fullText, localizationKey, action)
	console.log(`🚀 ~ TargetNodeStyleUpdate ~ { xmlString, styleStoreArray, effectStyle, rowText }:`, {
		xmlString,
		styleStoreArray,
		effectStyle,
		rowText,
	})
	// styleStoreArray 에서 공통 스타일 추출해야하는 걸로 보임

	const tempPosition = {
		x: node.x,
		y: node.y,
	}

	// 수정하려면 처리 해야함
	await textFontLoad(node)
	node.characters = rowText
	await setResetStyle({
		textNode: node,
	})
	for (const item of styleStoreArray) {
		for (const range of item.ranges) {
			await setAllStyleRanges({
				textNode: node,
				xNodeId,
				styleData: {
					styleData: item.style,
					boundVariables: item.style.boundVariables,
					effectStyleData: effectStyle?.style,
				},
				range: {
					start: range.start,
					end: range.end,
				},
			})
		}
	}

	try {
		// 인스턴스 노드인 경우 x, y 속성을 변경할 수 없음
		if (node.parent && node.parent.type !== 'INSTANCE') {
			node.x = tempPosition.x
			node.y = tempPosition.y
		}
	} catch (error) {
		console.error('위치 속성 설정 중 오류 발생:', error)
	}

	// 여기서 변수 처리?
}

const labelToResource = async (localizationKey: string, action: ActionType) => {
	/** 요청 데이터 */
	if (localizationKey) {
		const data = await keyActionFetchCurry(localizationKey, action)()

		/** 레이블 맵핑 */
		const mapping = labelKeyMapping(data)
		return mapping
	}

	return {}
}

/** 이거 클라이언트용임 */
export const xmlToStyle = async (xml: string, localizationKey: number | string, action: ActionType) => {
	const clientFetchDB = clientFetchDBCurry()
	const styleStore: Record<string, StyleSync> = {}

	let start = 0
	let end = 0

	let effectStyle = {} as Omit<StyleSync, 'ranges'>
	let rowText = ''

	// 리소스 태그 구분하지 않고 일단 긁은다음 , 1,2,3,4,5 ~
	// xml 캐그에서 순서 맞춰서 스타일 처리

	const mapping = await labelToResource(localizationKey.toString(), action)

	// 클라이언트에서도 스타일을 받아야하나?

	let tempXml = xml

	for (const [key, value] of Object.entries(mapping)) {
		tempXml = await convertTag(tempXml, key, value)
	}

	const flatData = await parseXmlToFlatStructure(tempXml)

	for (const item of flatData) {
		const key = item.tagName
		const [effectKey, key2] = key.split(':')
		if (Object.keys(effectStyle).length === 0) {
			const EffectResource = await clientFetchDB(`/resources/${effectKey}` as '/resources/{id}', {
				method: 'GET',
			})
			const EffectResourceResult = (await EffectResource.json()) as ResourceDTO
			effectStyle = {
				hashId: EffectResourceResult.hash_value,
				name: EffectResourceResult.style_name,
				id: EffectResourceResult.resource_id.toString(),
				alias: EffectResourceResult.alias,
				style: EffectResourceResult.style_value ?? {},
			}
		}

		console.log('🚀 ~ xmlToStyle ~ item:', item)

		let value = ''
		let length = 0
		if (item.tagName === 'br') {
			rowText += '\n'
			length = 1
		} else {
			value = item.text ?? ''
			rowText += value
			length = value.length
		}
		console.log('🚀 ~ xmlToStyle ~ length:', value, length)
		end = start + length

		if (!['br'].includes(key)) {
			const onlineStyle = await clientFetchDB(`/resources/${key2}` as '/resources/{id}', {
				method: 'GET',
			})
			if (onlineStyle.status === 200) {
				const responseResult = (await onlineStyle.json()) as ResourceDTO
				if (responseResult) {
					const newHashId = responseResult.hash_value
					const before = styleStore[newHashId]
					const ranges = before?.ranges ?? []
					const newId = responseResult.resource_id.toString()
					const newAlias = responseResult.alias
					const newName = responseResult.style_name
					const newStyle = responseResult.style_value ?? {}
					const newRanges = {
						start,
						end,
						text: value,
					}
					const store = {
						hashId: newHashId,
						name: newName,
						id: newId,
						alias: newAlias,
						style: newStyle,
						ranges: [...ranges, newRanges],
					}
					styleStore[newHashId] = store as StyleSync
				}
			}
		}
		start = end
	}

	return { xmlString: xml, styleStoreArray: Object.values(styleStore), effectStyle, rowText }
}

// 전역 캐시 객체 추가 - ranges 정보 제외
interface StyleResourceCacheItem {
	name: string
	id: string
	alias?: string
	style: any
}

export const styleResourceCache: Record<string, StyleResourceCacheItem> = {}

export const effectResourceCache: Record<string, Omit<StyleSync, 'ranges'>> = {}

export const styleToXml = async (
	domainId: number | string,
	originCharacters: string,
	styleData: StyleData,
	mode: 'id' | 'name'
) => {
	console.log('characters 업데이트 시점과 styleData시점이 별개임으로 스플릿이 과도하게 생길 수 있음')

	const characters = originCharacters.replace(/\u2028/g, '<br/>')

	const clientFetchDB = clientFetchDBCurry(domainId)
	const segments = createStyleSegments(characters, styleData.styleData)
	const boundVariables = createStyleSegments(characters, styleData.boundVariables)
	const allStyleGroups = groupAllSegmentsByStyle(characters, segments, boundVariables)
	const { exportStyleGroups, defaultStyle } = allStyleGroups

	const effectData = styleData.effectStyleData
	const hashId = createStyleHashId(effectData)

	let effectStyle = {} as Omit<StyleSync, 'ranges'>

	if (effectResourceCache[hashId]) {
		effectStyle = effectResourceCache[hashId]
	} else {
		const effectResource = await clientFetchDB('/resources', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				styleValue: effectData,
				hashValue: hashId,
				styleType: 'effect',
			}),
		})

		const responseResult = (await effectResource.json()) as ResourceDTO

		effectStyle = {
			hashId: responseResult.hash_value,
			name: responseResult.style_name,
			id: responseResult.resource_id.toString(),
			alias: responseResult.alias,
			style: responseResult.style_value,
		}
		effectResourceCache[hashId] = effectStyle
	}
	const styleStore: Record<string, StyleSync> = {}

	for (const style of exportStyleGroups) {
		// 캐시 확인 - 이미 같은 해시 ID로 요청한 적이 있는지 확인
		if (styleResourceCache[style.hashId]) {
			// 캐시된 값 사용하되, ranges는 현재 계산된 값 사용
			const cachedData = styleResourceCache[style.hashId]
			styleStore[style.hashId] = {
				hashId: style.hashId,
				name: cachedData.name,
				id: cachedData.id,
				alias: cachedData.alias,
				style: cachedData.style,
				ranges: style.ranges, // 현재 계산된 ranges 사용
			}

			continue
		}

		// 캐시에 없는 경우 API 요청 실행
		const temp = await clientFetchDB('/resources', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				styleValue: style.style,
				hashValue: style.hashId,
				styleType: 'style',
			}),
		})
		if (!temp) {
			continue
		}
		const tempResponseResult = (await temp.json()) as ResourceDTO
		if (tempResponseResult) {
			const newId = tempResponseResult.resource_id.toString()
			const newAlias = tempResponseResult.alias
			const newName = tempResponseResult.style_name

			// 결과를 캐시에 저장 (ranges 제외)
			styleResourceCache[style.hashId] = {
				name: newName,
				id: newId,
				alias: newAlias,
				style: style.style,
			}

			// styleStore에는 모든 데이터 포함
			styleStore[style.hashId] = {
				hashId: style.hashId,
				name: newName,
				id: newId,
				alias: newAlias,
				style: style.style,
				ranges: style.ranges,
			}
		}
	}

	const styleStoreArray = Object.values(styleStore)
	const xmlString = generateXmlString(styleStoreArray, mode, effectStyle)
	// 피그마에서 스타일을 항상 가져오고 있기 때문에 값이 있을 수 있음
	// xml 을 먼저 가져오고 스타일을 가져오게 되면 스타일이 없을 수 있음
	// key, action 으로 조회 할 때 , xml에 있고 스타일이 없을 수 있다는 말
	//
	const map = {
		'1:2': 'a',
		'1:3': 'b',
	}
	const brString = xmlString.replace(/\n/g, '<br/>')
	const _flatItems = await parseXmlToFlatStructure(brString)
	let temp = brString

	for (const [key, value] of Object.entries(map)) {
		temp = await replaceTagNames(temp, key, value)
	}

	return { xmlString, styleStoreArray, effectStyle }
}
