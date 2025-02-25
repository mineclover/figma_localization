import { CurrentCursorType, NodeData } from '../utils/featureType'
import { emit, on } from '@create-figma-plugin/utilities'
import {
	GET_CURSOR_POSITION,
	GET_PROJECT_ID,
	NODE_STORE_KEY,
	SET_NODE_LOCATION,
	SET_PROJECT_ID,
	STORE_KEY,
} from '../constant'

import { FilePathNodeSearch, notify } from '@/figmaPluginUtils'
import { getCursorPosition } from './LabelModel'
import { fetchDB } from '../utils/fetchDB'
import { DomainSettingType, getDomainSetting } from '../Setting/SettingModel'
import { getFigmaRootStore } from '../utils/getStore'

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

// export const localizationKeyMapping = (dto: LocalizationKeyDTO): LocalizationKey => {
// 	return {
// 		keyId: dto.key_id,
// 		domainId: dto.domain_id,
// 		name: dto.name,
// 		alias: dto.alias,
// 		parentKeyId: dto.parent_key_id,
// 		isVariable: dto.is_variable === 1,
// 		isTemporary: dto.is_temporary === 1,
// 		sectionId: dto.section_id,
// 		version: dto.version,
// 		isDeleted: dto.is_deleted === 1,
// 		createdAt: dto.created_at,
// 		updatedAt: dto.updated_at,
// 	}
// }

export type LocalizationKeyProps = {
	domainId: number
	name: string
	alias?: string
	sectionId?: number
	parentKeyId?: number
	isVariable?: boolean
	isTemporary?: boolean
}

export const generateLocalizationName = (keyData: LocalizationKeyDTO) => {
	/** 임시 값이면 @ 붙이고 아니면 # 붙임 */
	const prefix = keyData.is_temporary ? '@' : '#'
	const name = prefix + keyData.name

	return name
}

export const reloadLocalizationName = async (node: BaseNode) => {
	const nodeData = await getNodeData(node)
	if (nodeData.localizationKey === '') {
		return
	}

	const result = await fetchDB(('/localization/keys/id/' + nodeData.localizationKey) as '/localization/keys/id/{id}', {
		method: 'GET',
	})

	if (!result) {
		return
	}
	const data = (await result.json()) as LocalizationKeyDTO

	node.name = generateLocalizationName(data)
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
		await reloadLocalizationName(node)

		// 두번 눌렀을 때 처리 어떻게 할지 정해야 됨

		const NodeData = await getNodeData(node)

		emit(GET_CURSOR_POSITION.RESPONSE_KEY, { ...result, data: NodeData })
	})
}

/** 플러그인 데이터 조회 */
export const getNodeData = async (node: BaseNode) => {
	const locationKey = node.getPluginData(NODE_STORE_KEY.LOCATION)
	const localizationKey = node.getPluginData(NODE_STORE_KEY.LOCALIZATION_KEY)
	const originalLocalizeId = node.getPluginData(NODE_STORE_KEY.ORIGINAL_LOCALIZE_ID)

	return {
		locationKey: locationKey,
		localizationKey: localizationKey,
		originalLocalizeId: originalLocalizeId,
	} as NodeData
}
