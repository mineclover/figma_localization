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

export const targetSetNodeLocation = async (node: BaseNode) => {
	const nodeLocation = await getCursorPosition(node)
	if (!nodeLocation) {
		return
	}

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
	console.log('🚀 ~ targetSetNodeLocation ~ result:', result)

	const data = (await result.json()) as LocationDTO

	const location = locationMapping(data)
	console.log('🚀 ~ targetSetNodeLocation ~ location:', location)

	if (result.status === 200) {
		node.setPluginData(NODE_STORE_KEY.LOCATION, location.location_id.toString())
		notify('Location set successfully', 'success')
	} else {
		notify('Failed to set location', 'error')
	}
}

/** 플러그인 데이터 생성 */
export const onTargetSetNodeLocation = () => {
	on(SET_NODE_LOCATION.REQUEST_KEY, async () => {
		const node = figma.currentPage.selection[0]
		await targetSetNodeLocation(node)

		const result = await getCursorPosition(node)

		emit(GET_CURSOR_POSITION.RESPONSE_KEY, result)
	})
}

/** 플러그인 데이터 조회 */
export const getNodeData = async (node: BaseNode) => {
	const locationKey = node.getPluginData(NODE_STORE_KEY.LOCATION)

	return {
		locationKey: locationKey,
		localizationKey: '',
		originalLocalizeId: '',
	} as NodeData
}
