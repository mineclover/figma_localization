import { emit, on } from '@create-figma-plugin/utilities'
import toNumber from 'strnum'
import { notify } from '@/figmaPluginUtils'
import { getAllStyleRanges } from '@/figmaPluginUtils/text'
import type { PageSelectIdsToBoxHandler } from '@/figmaPluginUtils/types'
import { keyIdNameSignal } from '@/model/signal'
import type { LocalizationKeyAction, LocalizationTranslationDTO, LocationDTO } from '@/model/types'
import type { XmlFlatNode } from '@/utils/types'
import { parseXmlToFlatStructure, replaceTagNames, unwrapTag, wrapTextWithTag } from '@/utils/xml2'
import { NODE_STORE_KEY, SET_NODE_LOCATION, TRANSLATION_ACTION_PAIR } from '../constant'
import { getCursorPosition, getExtendNodeData, getNodeData, nodeMetaData } from '../getState'
import { getPageId, getProjectId } from '../Label/LabelModel'
import {
	generateLocalizationName,
	type PutLocalizationKeyType,
	putLocalizationKey,
	setNodeData,
} from '../Label/TextPluginDataModel'
import { getDomainSetting } from '../Setting/SettingModel'
import { keyActionFetchCurry } from '../Style/actionFetch'
import { styleToXml } from '../Style/styleAction'
import type { ActionType } from '../System/ActionResourceDTO'
import { fetchDB } from '../utils/fetchDB'
import { getFrameNodeMetaData, MetaData, searchStore } from './searchStore'
import { overlayRender, postClientLocation } from './visualModel'

export const setNodeLocation = async (node: SceneNode) => {
	const domainSetting = getDomainSetting()
	if (!domainSetting) {
		return
	}

	const currentPointer = getCursorPosition(node)
	if (!currentPointer) {
		return
	}
	const response = await fetchDB('/figma/locations', {
		method: 'POST',
		body: JSON.stringify({
			projectId: currentPointer.projectId,
			pageId: currentPointer.pageId,
			nodeId: currentPointer.nodeId,
		}),
	})

	if (response.ok) {
		const data = (await response.json()) as LocationDTO
		const baseNodeId = String(data.location_id)
		setNodeData(node, {
			baseNodeId: baseNodeId,
		})
		return data
	}

	return
}

export const idSetLocation = async (nodeId: string) => {
	const node = await figma.getNodeByIdAsync(nodeId)
	if (!node) {
		return
	}

	return setNodeLocation(node as SceneNode)
}

// ---------------------------- 변환 파이프라인  ------------------------------
/** 파싱 */
export const xmlParse = async (xmlString: string) => {
	const flatItems = await parseXmlToFlatStructure(xmlString)
	return flatItems
}

export const targetKeyParse = (flatItems: XmlFlatNode[]) => {
	const targetKey = flatItems.filter(item => item.tagName !== 'br')

	return new Set(targetKey.map(item => item.tagName))
}

/**
 * 키 이름 변경 맵 받아서 변환
 * @param flatItems
 * @returns
 */
export const diff = (list: Awaited<ReturnType<typeof targetKeyParse>>, data: LocalizationKeyAction[]) => {
	const keyMap: Record<string, string> = {}

	// 쓰기 좋게 키 이름으로 빈 문자열 만들고
	for (const item of list) {
		if (item !== '') {
			keyMap[item] = ''
		}
	}
	const output = data.reduce((acc, item, _index) => {
		const effectKey = item.effect_resource_id
		const styleKey = item.style_resource_id
		const normalKey = [effectKey, styleKey].join(':')
		acc[normalKey] = item.from_enum
		return acc
	}, keyMap)

	return output
}

const changeXml = async (text: string, tags: Record<string, string>) => {
	const brString = text.replace(/\n/g, '<br/>')
	let result = brString

	for (const [key, value] of Object.entries(tags)) {
		if (value !== '') {
			result = await replaceTagNames(result, key, value)
		}
	}
	const result1 = await unwrapTag(result)
	const result2 = await wrapTextWithTag(result1)

	console.log('🚀 ~ 무결성 검사 : ', result === result2)
	const brString2 = result1.replace(/\n/g, '<br/>')

	return brString2
}

export type TranslationInputType = {
	localizationKey: string
	locationId: string
	action: ActionType
	prefix: string
	name: string
	// ids: string[]; // or nodeId 베이스 선택용
	sectionId: number
	targetNodeId: string
	beforeIds: string[]
}

/**
 *
 * @param index 26 이상 넘어가면 안됨
 * @returns
 */
function getLetterByIndex(index: number) {
	if (index < 0 || index >= 26) {
		throw new Error('Index out of range')
	}

	const alphabet = 'abcdefghijklmnopqrstuvwxyz'

	return alphabet[index]
}

export const addTranslationV2 = async (node: TextNode, localizationKey: string, action: ActionType) => {
	// me
	const nodeData = getNodeData(node)

	if (localizationKey === '' || nodeData.domainId == null) {
		notify('335 Failed to get localization key', 'error')
		return
	}

	const styleData = getAllStyleRanges(node)
	const { xmlString, styleStoreArray, effectStyle } = await styleToXml(
		toNumber(nodeData.domainId),
		node.characters,
		styleData,
		'id'
	)

	const fn1 = await xmlParse(xmlString)

	const fn2 = targetKeyParse(fn1)

	const tags = Array.from(fn2).reduce(
		(acc, item, index) => {
			const letter = getLetterByIndex(index)
			acc[item] = letter
			return acc
		},
		{} as Record<string, string>
	)

	const brString = await changeXml(xmlString, tags)

	// 대부분의 시스템에서 \n는 공백으로 처리되기 때문에 시각적으로 보이지 않음
	// 따라서 시각적으로 보이게 하기 위해 br로 처리하는게 합리적이게 보임
	// 피그마에서 공백은 \n이 아닌 다른 값임 찾아서 넣어야할 수 있음

	// 저장할 때부터 a 먹여서 넣어야하니까 여기부터 하면 됨
	try {
		const translations = await fetchDB('/localization/translations', {
			method: 'PUT',
			body: JSON.stringify({
				keyId: localizationKey,
				language: 'origin',
				translation: brString,
			}),
		})
		if (!translations) {
			return
		}
		if (translations.status === 200) {
			const data = (await translations.json()) as LocalizationTranslationDTO
			console.log('🚀 ~ addTranslationV2 ~ data:', data)
		} else {
			// response에서 값 읽어서 안전하게 뽑는 것을 고려할만 함
			const data = await translations.json()

			// 잘못 등록된  경우도 에러임
			if (data.message.details === 'SQLITE_CONSTRAINT: FOREIGN KEY constraint failed') {
				notify('로컬라이제이션 키를 찾을 수 없음', 'error')
			} else {
				notify('오리진 값이 등록되지 않았을 확률이 큼', 'error')
			}
		}
	} catch (_error) {}

	console.log('🚀 ~ addTranslationV2 ~ styleStoreArray:', styleStoreArray)

	// 액션 = 키 매핑
	for (const [key, value] of Object.entries(tags)) {
		const [styleResourceId, effectResourceId] = key.split(':')
		// 매핑 로직이 변경 됨
		// key , action,type
		const result = await fetchDB('/localization/actions', {
			method: 'POST',
			body: JSON.stringify({
				keyId: localizationKey,
				action: action,
				fromEnum: value, // Changed to string since from_enum is TEXT type
				styleResourceId,
				effectResourceId,
			}),
		})
		if (!result) {
			notify(`Failed to set localization - actions mapping ${key}`, 'error')
			continue
		}
		if (result) {
			const data = await result.json()
			console.log('🚀 ~ addTranslationV2 ~ data:', data)
		}
	}
}

export const onTranslationActionRequest = () => {
	on(TRANSLATION_ACTION_PAIR.REQUEST_KEY, async (data: TranslationInputType) => {
		const { localizationKey, locationId, action, prefix: tempPrefix, name, sectionId, beforeIds } = data

		const prefix = tempPrefix.toUpperCase()
		console.log(`🚀 ~ on ~  { localizationKey, baseNodeId, action, prefix, name, nodeId, sectionId }:`, {
			localizationKey,
			locationId,
			action,
			prefix,
			name,

			sectionId,
			beforeIds,
		})
		// 1. 베이스 아이디의 기준 location 이 변경 될 수 있다
		// 2. 일단 키 등록 된 상태로 오지만 origin은 등록되지 않았다
		// 3. 이름 변경되서 올 수 있다

		const baseIds = new Map()
		const idsNodeData = [] as MetaData[]
		const targetNodes = [] as TextNode[]

		for (const nodeId of beforeIds) {
			const node = await figma.getNodeByIdAsync(nodeId)
			if (node && node.type === 'TEXT') {
				const metadata = nodeMetaData(node)
				targetNodes.push(node)
				idsNodeData.push(metadata)
				if (metadata.baseNodeId) {
					baseIds.set(metadata.baseNodeId, metadata)
				}
			}
		}
		if (baseIds.size !== 1) {
			notify('baseId가 1이 아님', '닫기')
			return
		}
		const baseNodeData = baseIds.values().next().value as MetaData
		const location_node_id = baseNodeData.baseNodeId
		// const idsNodeData = nextIdsNode.map(item => getFrameNodeMetaData(item as FrameNode))

		if (!location_node_id) {
			notify('베이스 아이디를 찾을 수 없음', 'error')
			return
		}

		const baseNode = await figma.getNodeByIdAsync(baseNodeData.id)
		if (!baseNode) {
			notify('베이스 아이디를 찾을 수 없음', 'error')
			return
		}

		const domainSetting = getDomainSetting()
		const projectId = getProjectId()
		const pageId = getPageId()
		if (!projectId || !pageId || !domainSetting) {
			notify('프로젝트 아이디 또는 페이지 아이디를 찾을 수 없음', 'error')
			return
		}

		// 로케이션 베이스 아이디 업데이트 > 변경 요청
		// if (targetNodeId && targetNodeId !== '') {
		// 	console.log('🚀 ~ on ~ targetNodeId:', targetNodeId)
		// 	await searchStore.updateBaseNode(locationId, { nodeId: targetNodeId, pageId, projectId })
		// }

		const reg = new RegExp(`^${prefix}`, 'g')
		const baseName = `${prefix}_${(name ?? '').replace(reg, '')}`

		// 중복 이름 관리 및 재시도 로직
		const maxRetries = 5
		let retryCount = 0
		let result1 = null
		let currentName = baseName
		const duplicateNames: string[] = []
		let localizationSuccess = false

		while (retryCount < maxRetries) {
			try {
				const putLocalizationData: PutLocalizationKeyType = {
					name: currentName,
					alias: currentName,
					sectionId: sectionId,
					domainId: domainSetting.domainId,
				}

				result1 = await putLocalizationKey(localizationKey, putLocalizationData)

				if (result1?.success) {
					notify(result1?.message ?? '로컬라이제이션 키 업데이트 성공', 'ok')
					updateLocalizationResponse(localizationKey, putLocalizationData)
					localizationSuccess = true
					break
				} else {
					// 중복 이름 에러인지 확인
					const errorMessage = result1?.message || ''
					if (errorMessage.includes('이미 존재하는 키') || errorMessage.includes('UNIQUE constraint')) {
						duplicateNames.push(currentName)
						retryCount++

						if (retryCount < maxRetries) {
							// 중복된 이름에 숫자 추가
							currentName = `${baseName}_${retryCount}`
							console.log(`중복된 이름 발견: ${duplicateNames.join(', ')}. 새로운 이름으로 재시도: ${currentName}`)
							continue
						} else {
							notify(`중복된 이름으로 인한 실패. 시도한 이름들: ${duplicateNames.join(', ')}`, 'error')
							break
						}
					} else {
						// 다른 종류의 에러
						notify(result1?.message ?? '로컬라이제이션 키 업데이트 실패', 'error')
						break
					}
				}
			} catch (error) {
				retryCount++
				if (retryCount < maxRetries) {
					console.log(`로컬라이제이션 키 업데이트 중 오류 발생, ${retryCount}/${maxRetries} 재시도 중...`, error)
					await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
				} else {
					notify('로컬라이제이션 키 업데이트 중 오류 발생 (최대 재시도 횟수 초과)', 'error')
				}
			}
		}

		// 스타일 추출과 텍스트 업데이트
		const result2 = await addTranslationV2(baseNode as TextNode, localizationKey, action)
		console.log('🚀 ~ on ~ result2:', result2)

		// 위치 매핑 업데이트
		// action 연결은 로케이션 연결용이기 때문에 a,b,c 등 여러가지 연결할 필요 없어서 a로 고정적으로 처리함
		// action은 여러개 올 수 있음
		const result = await fetchDB('/figma/location-actions', {
			method: 'POST',
			body: JSON.stringify({
				keyId: localizationKey,
				action: action,
				locationId: locationId,
				fromEnum: 'a',
			}),
		})
		if (!result) {
			notify(`Failed to set location - actions mapping ${locationId}`, 'error')
		}
		if (result) {
			const data = await result.json()
			console.log('🚀 ~ on ~ data:', data)

			// 로컬라이제이션 키 업데이트가 성공한 경우에만 노드 이름 변경
			if (localizationSuccess) {
				console.log('🚀 ~ locations.ts:355 ~ onTranslationActionRequest ~ targetNodes:', targetNodes, currentName)
				for (const node of targetNodes) {
					console.log('🚀 ~ locations.ts:397 ~ onTranslationActionRequest ~ currentName:', currentName)
					node.name = currentName
				}
			}
		}
	})
}

export const onGetBaseNode = () => {
	// baseStore도 초기화 됨
	searchStore.refresh()

	postClientLocation()
}

/** 특정 값으로 노드 줌 */
export const onTextToFrameSelect = () => {
	on<PageSelectIdsToBoxHandler>('PAGE_SELECT_IDS_TO_BOX', ({ ids, select }) => {
		// console.log('🚀 ~ pageSelectIds_Adapter ~ ids:', ids);

		const nodes = ids
			.map(id => {
				const node = searchStore.getTextToFrame(id)
				return node
			})
			.filter(item => item != null)
		// const nodes = figma.currentPage.findAll((node) => ids.includes(node.id));

		if (nodes) {
			// 노드로 화면 줌
			if (select) {
				figma.currentPage.selection = nodes
			}
			figma.viewport.scrollAndZoomIntoView(nodes)
		}
	})
}

/** 클라이언트로 보내는 것 */
export const updateLocalizationResponse = (localizationKey: string, putLocalizationData: PutLocalizationKeyType) => {
	emit(TRANSLATION_ACTION_PAIR.RESPONSE_KEY, {
		localizationKey,
		...putLocalizationData,
	} as { localizationKey: string } & PutLocalizationKeyType)
}

export const onTranslationActionResponse = () => {
	return on(
		TRANSLATION_ACTION_PAIR.RESPONSE_KEY,
		async (data: { localizationKey: string } & PutLocalizationKeyType) => {
			console.log('🚀 ~ onTranslationActionResponse ~ data:', data)
			const { localizationKey, name, alias, sectionId, domainId } = data

			if (name === '' || name == null) {
				return
			}

			const oldValue = keyIdNameSignal.value
			console.log('🚀 ~ on ~ oldValue:', oldValue)
			keyIdNameSignal.value = {
				...oldValue,
				[localizationKey]: name,
			}
		}
	)
}
