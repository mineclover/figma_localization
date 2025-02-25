import { CurrentCursorType, NodeData } from '../utils/featureType'
import { emit, on } from '@create-figma-plugin/utilities'
import {
	GET_CURSOR_POSITION,
	GET_LOCALIZATION_KEY_VALUE,
	GET_PROJECT_ID,
	GET_TRANSLATION_KEY_VALUE,
	NODE_STORE_KEY,
	PUT_LOCALIZATION_KEY,
	RELOAD_NODE,
	SET_NODE_LOCATION,
	SET_NODE_RESET_KEY,
	SET_PROJECT_ID,
	STORE_KEY,
} from '../constant'

import { FilePathNodeSearch, notify } from '@/figmaPluginUtils'
import { getCursorPosition } from './LabelModel'
import { fetchDB } from '../utils/fetchDB'
import { DomainSettingType, getDomainSetting } from '../Setting/SettingModel'
import { getFigmaRootStore } from '../utils/getStore'
import { ERROR_CODE } from '../errorCode'
import { textFontLoad } from '@/figmaPluginUtils/text'
import { signal } from '@preact/signals-core'
import { components } from 'types/i18n'

export type LocationDTO = {
	created_at: string
	is_deleted: number
	is_pinned: number
	location_id: number
	node_id: string
	page_id: string
	project_id: string
	updated_at: string
}

export type Location = {
	location_id: number
	project_id: string
	node_id: string
	page_id: string
	is_pinned: boolean
	is_deleted: boolean
	created_at: string
	updated_at: string
}

export const locationMapping = (location: LocationDTO): Location => {
	return {
		location_id: location.location_id,
		project_id: location.project_id,
		node_id: location.node_id,
		page_id: location.page_id,
		is_pinned: location.is_pinned === 1,
		is_deleted: location.is_deleted === 1,
		created_at: location.created_at,
		updated_at: location.updated_at,
	}
}

// 오로지 내부 연산용임 signal 쓸 일 없음

/**
 * 로케이션 설정
 * @param node
 * @returns
 */
export const createNodeLocation = async (node: BaseNode, nodeLocation: CurrentCursorType) => {
	const targetData = {
		projectId: nodeLocation.projectId,
		pageId: nodeLocation.pageId,
		nodeId: nodeLocation.nodeId,
		isPinned: false,
	}

	// targetData
	const result = await fetchDB('/figma/locations', {
		method: 'POST',
		body: JSON.stringify(targetData, null, 2),
	})

	if (!result) {
		return
	}

	const data = (await result.json()) as LocationDTO

	const location = locationMapping(data)

	if (result.status === 200) {
		node.setPluginData(NODE_STORE_KEY.LOCATION, location.location_id.toString())
	} else {
		notify('Failed to set location', 'error')
	}
}

export type LocalizationKeyDTO = {
	key_id: number
	domain_id: number
	name: string
	alias?: string
	parent_key_id?: number
	is_variable: number
	is_temporary: number
	section_id?: number
	version: number
	is_deleted: number
	created_at: string
	updated_at: string
}

export type LocalizationKey = {
	key_id: number
	domain_id: number
	name: string
	alias?: string
	parent_key_id?: number
	is_variable: boolean
	is_temporary: boolean
	section_id?: number
	version: number
	is_deleted: boolean
	created_at: string
	updated_at: string
}

export const localizationKeySignal = signal<LocalizationKey | null>(null)

export const localizationKeyMapping = (dto: LocalizationKeyDTO): LocalizationKey => {
	console.log('🚀 ~ localizationKeyMapping ~ dto:', dto)
	return {
		key_id: dto.key_id,
		domain_id: dto.domain_id,
		name: dto.name,
		alias: dto.alias,
		parent_key_id: dto.parent_key_id,
		is_variable: dto.is_variable === 1,
		is_temporary: dto.is_temporary === 1,
		section_id: dto.section_id,
		version: dto.version,
		is_deleted: dto.is_deleted === 1,
		created_at: dto.created_at,
		updated_at: dto.updated_at,
	}
}

/** 키 데이터 조회 */
export const onGetLocalizationKeyData = () => {
	on(GET_LOCALIZATION_KEY_VALUE.REQUEST_KEY, async () => {
		const node = figma.currentPage.selection[0]
		const value = await processTextNodeLocalization(node)
		emit(GET_LOCALIZATION_KEY_VALUE.RESPONSE_KEY, value)
	})
}
export const onGetLocalizationKeyResponse = () => {
	emit(GET_LOCALIZATION_KEY_VALUE.REQUEST_KEY)
	return on(GET_LOCALIZATION_KEY_VALUE.RESPONSE_KEY, (data) => {
		localizationKeySignal.value = data
	})
}
/** 키에 소속된 모든 번역 값 조회 */
export const getNodeTranslations = async (node: BaseNode) => {
	const nodeData = getNodeData(node)
	if (nodeData.localizationKey === '') {
		return
	}
	return await getTargetTranslations(nodeData.localizationKey)
}

/**
 * 키에 번역된 언어 검색 , 작업 중
 * 리스트로 보내야 함
 */
export const onGetKeyTranslations = () => {
	on(GET_LOCALIZATION_KEY_VALUE.REQUEST_KEY, async () => {
		const node = figma.currentPage.selection[0]
		if (!node || node.type !== 'TEXT') {
			return
		}

		const result = await getNodeTranslations(node)
		console.log('🚀 ~ on ~ result:', result)
	})
}

/** 낙관적 업데이트로 반영 */
export const onSetNodeResetKey = () => {
	on(SET_NODE_RESET_KEY.REQUEST_KEY, async () => {
		const node = figma.currentPage.selection[0]
		if (!node || node.type !== 'TEXT') {
			return
		}
		node.setPluginData(NODE_STORE_KEY.LOCALIZATION_KEY, '')
		node.setPluginData(NODE_STORE_KEY.ORIGINAL_LOCALIZE_ID, '')
		node.setPluginData(NODE_STORE_KEY.LOCATION, '')
		node.autoRename = true
	})
}
/** ui , 작업 중 */
export const onLocalizationKeyTranslationsResponse = () => {
	emit(GET_TRANSLATION_KEY_VALUE.REQUEST_KEY)
	return on(GET_TRANSLATION_KEY_VALUE.RESPONSE_KEY, (data) => {
		localizationKeySignal.value = data
	})
}

export type LocalizationKeyProps = {
	domainId: number
	name: string
	alias?: string
	sectionId?: number
	parentKeyId?: number
	isVariable?: boolean
	isTemporary?: boolean
}

// TextPluginDataModel 타입 정의
export type LocalizationTranslationDTO = {
	created_at: string
	is_deleted: number
	key_id: number
	language_code: string
	last_modified_by: null | string
	localization_id: number
	text: string
	updated_at: string
	version: number
}

export type LocalizationTranslation = {
	created_at: string
	is_deleted: boolean
	key_id: number
	language_code: string[]
	last_modified_by: string | null
	localization_id: number
	text: string
	updated_at: string
	version: number
}

export const generateLocalizationName = (keyData: LocalizationKeyDTO) => {
	/** 임시 값이면 @ 붙이고 아니면 # 붙임 */
	const prefix = keyData.is_temporary ? '@' : '#'
	const name = prefix + keyData.name

	return name
}

// 캐시 시스템 구현
interface CacheItem<T> {
	timestamp: number
	data: T
}

const requestCache = new Map<string, CacheItem<any>>()

/**
 * 로컬라이제이션 키를 기준으로 이름 리로드
 */
export const getLocalizationKeyData = async (node: BaseNode, now: number) => {
	const localizationKey = node.getPluginData(NODE_STORE_KEY.LOCALIZATION_KEY)
	if (localizationKey === '') {
		return
	}

	const apiPath = '/localization/keys/id/' + localizationKey
	const cacheKey = apiPath

	const cachedItem = requestCache.get(cacheKey)

	// 캐시된 항목이 있고, 캐시 기간이 지나지 않았으면 캐시된 데이터 반환 (0.5초)

	if (cachedItem && now - (cachedItem?.timestamp ?? 0) < 1000) {
		console.log(`캐시된 데이터 반환: ${cacheKey}`)
		return cachedItem.data
	}

	// 캐시가 없거나 만료된 경우 새로운 요청 수행
	const result = await fetchDB(apiPath as '/localization/keys/id/{id}', {
		method: 'GET',
	})

	if (!result || result.status === 500) {
		return
	}
	const data = (await result.json()) as LocalizationKeyDTO

	if (result.status === 200) {
		node.name = generateLocalizationName(data)
		// 결과 캐싱
		requestCache.set(cacheKey, {
			timestamp: now,
			data: data,
		})
		console.log('캐싱 갱신 됨')
		return data
	}
	return
}

export const getTargetLocalizationName = async (id: string) => {
	const result = await fetchDB(('/localization/translations/' + id) as '/localization/translations/{id}', {
		method: 'GET',
	})

	if (!result) {
		return
	}

	const data = (await result.json()) as LocalizationTranslationDTO
	return data.text
}

/** 번역에 대해 수정하거나 업데이트하거나 */
export const putTargetTranslations = async (id: string, language: string, text: string) => {
	const result = await fetchDB('/localization/translations', {
		method: 'PUT',
		body: JSON.stringify({
			keyId: id,
			language: language,
			translation: text,
		}),
	})

	if (!result) {
		return
	}

	const data = (await result.json()) as LocalizationTranslationDTO

	return data
}

/** 하나만 얻음 */
export const searchTargetLocalization = async (id: string, language: string) => {
	const result = await fetchDB('/localization/translations/search', {
		method: 'POST',
		body: JSON.stringify({
			keyId: id,
			language: language,
		}),
	})

	if (!result) {
		return
	}

	const data = (await result.json()) as LocalizationTranslationDTO
	console.log('🚀 ~ postTargetLocalizationName ~ data:', data)

	return data.text
}
/** 키 아이디 기반으로 여러개 얻음 */
export const getTargetTranslations = async (id: string) => {
	const result = await fetchDB(
		('/localization/keys/' + id + '/translations') as '/localization/keys/{id}/translations',
		{
			method: 'GET',
		}
	)

	if (!result) {
		return
	}

	const data = (await result.json()) as LocalizationTranslationDTO[]
	console.log('🚀 ~ postTargetLocalizationName ~ data:', data)

	return data
}

/**
 * 오리지널 로컬라이제이션 키를 기준으로 값 일괄 수정
 */
export const reloadOriginalLocalizationName = async (node: BaseNode) => {
	const nodeData = getNodeData(node)
	if (nodeData.localizationKey === '') {
		return
	}
	const localizationKey = nodeData.localizationKey
	figma.skipInvisibleInstanceChildren = true

	const arr = figma.currentPage.findAllWithCriteria({
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
			if (localizationKey === currentLocalizationKey) {
				return true
			}
			return false
		})
		.map((item) => {
			const nodeData = getNodeData(item)
			if (nodeData.originalLocalizeId !== '') {
				let temp = targetOrigin.get(nodeData.originalLocalizeId)
				if (temp == null) {
					temp = new Set<TextNode>()
				}

				targetOrigin.set(nodeData.originalLocalizeId, temp.add(item))
			}
			return {
				node: item,
				data: nodeData,
			}
		})

	const now = Date.now()
	for (const [key, targetNode] of targetOrigin.entries()) {
		const a = await getTargetLocalizationName(key)
		if (a) {
			for (const node of targetNode) {
				getLocalizationKeyData(node, now)
				await textFontLoad(node)
				node.characters = a
			}
		}
	}
}

export const addTranslation = async (node: TextNode) => {
	const nodeData = getNodeData(node)

	if (nodeData.localizationKey === '') {
		return
	}

	const result = await fetchDB('/localization/translations', {
		method: 'PUT',
		body: JSON.stringify(
			{
				keyId: nodeData.localizationKey,
				language: 'origin',
				translation: node.characters,
			},
			null,
			2
		),
	})

	if (!result) {
		return
	}

	const data = (await result.json()) as LocalizationTranslationDTO

	if (result.status === 200) {
		node.setPluginData(NODE_STORE_KEY.ORIGINAL_LOCALIZE_ID, data.localization_id.toString())
	} else {
		notify('Failed to set location', 'error')
	}
}

/**
 * 일반 localization key 생성
 */
export const createNormalLocalizationKey = async (
	node: BaseNode,
	{ domainId, alias, name, sectionId }: LocalizationKeyProps
) => {
	const temp = {
		domainId: domainId,
		name: name,
		isTemporary: true,
		sectionId: sectionId,
	} as LocalizationKeyProps
	if (alias) {
		temp.alias = alias
	}

	// targetData
	const result = await fetchDB('/localization/keys', {
		method: 'POST',
		body: JSON.stringify(temp, null, 2),
	})

	if (!result) {
		return
	}

	const data = (await result.json()) as LocalizationKeyDTO

	if (result.status === 200) {
		node.setPluginData(NODE_STORE_KEY.LOCALIZATION_KEY, data.key_id.toString())
	} else {
		notify('Failed to set location', 'error')
	}
}

/**
 * 로컬라이제이션 텍스트 등록 과정
 * 플러그인 데이터 생성 */
export const onTargetSetNodeLocation = () => {
	on(SET_NODE_LOCATION.REQUEST_KEY, async () => {
		const node = figma.currentPage.selection[0]
		if (node.type !== 'TEXT') {
			return
		}
		const result = await getCursorPosition(node)

		if (!result) {
			return
		}
		/**
		 * result는 이전 값을 가지고 있음 init해도 안바뀜
		 * 새 값이 고정된 영역에 고정되있음
		 * */
		await createNodeLocation(node, result)
		// 임시 키 값 설정
		// 변경 가능하고 저장 가능하게 임시 값 보여야 함
		// 섹션 관리 되야 함

		const domainSetting = getDomainSetting()

		if (!domainSetting) {
			return
		}

		// section은 [sectionName] {기존 제목} 으로 처리 됨

		if (result.data.locationKey === '') {
			await createNormalLocalizationKey(node, {
				domainId: domainSetting.domainId,
				name: result.nodeName,
				sectionId: result.sectionId,
			})
		}
		await getLocalizationKeyData(node, Date.now())

		// 두번 눌렀을 때 처리 어떻게 할지 정해야 됨
		await addTranslation(node)

		/** 업데이트 반영 코드 */
		await allRefresh(node)
	})
}

export const allRefresh = async (node: TextNode) => {
	const cursorPosition = await getCursorPosition(node)
	emit(GET_CURSOR_POSITION.RESPONSE_KEY, cursorPosition)
	const value = await processTextNodeLocalization(node)
	emit(GET_LOCALIZATION_KEY_VALUE.RESPONSE_KEY, value)
}

export const onNodeReload = () => {
	on(RELOAD_NODE.REQUEST_KEY, async () => {
		const node = figma.currentPage.selection[0]
		if (!node || node.type !== 'TEXT') {
			return
		}

		figma.commitUndo()

		await reloadOriginalLocalizationName(node)
	})
}

/** 플러그인 데이터 조회 */
export const getNodeData = (node: BaseNode) => {
	const locationKey = node.getPluginData(NODE_STORE_KEY.LOCATION)
	const localizationKey = node.getPluginData(NODE_STORE_KEY.LOCALIZATION_KEY)
	const originalLocalizeId = node.getPluginData(NODE_STORE_KEY.ORIGINAL_LOCALIZE_ID)

	return {
		locationKey: locationKey,
		localizationKey: localizationKey,
		originalLocalizeId: originalLocalizeId,
	} as NodeData
}

/**
 * TEXT 타입 노드의 지역화 키에 대한 데이터를 처리합니다.
 * @param node 처리할 노드
 * @returns 지역화된 값 또는 undefined
 */
export const processTextNodeLocalization = async (node: SceneNode) => {
	if (!node || node.type !== 'TEXT') {
		return
	}

	const nodeData = getNodeData(node)
	if (nodeData.localizationKey === '') {
		return
	}

	const result = await getLocalizationKeyData(node, Date.now())
	if (!result) {
		return
	}

	return localizationKeyMapping(result)
}

export type PutLocalizationKeyType = components['schemas']['UpdateLocalizationKeyDTO']

export const onPutLocalizationKey = () => {
	on(PUT_LOCALIZATION_KEY.REQUEST_KEY, async (localizationKey: string, data: PutLocalizationKeyType) => {
		const result = await putLocalizationKey(localizationKey, data)
		console.log('🚀 ~ on ~ result:', result)

		if (!result) {
			return
		}

		// emit(PUT_LOCALIZATION_KEY.RESPONSE_KEY, result)
	})
}

export const putLocalizationKey = async (localizationKey: string, body: PutLocalizationKeyType) => {
	const result = await fetchDB(('/localization/keys/' + localizationKey) as '/localization/keys/{id}', {
		method: 'PUT',
		body: JSON.stringify(body, null, 2),
	})

	if (!result) {
		return
	}

	const data = (await result.json()) as LocalizationKeyDTO

	return data
}
