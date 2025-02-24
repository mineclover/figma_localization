import { signal } from '@preact/signals-core'
import { CurrentCursorType } from '../utils/featureType'
import { emit, on } from '@create-figma-plugin/utilities'
import { GET_CURSOR_POSITION, GET_PROJECT_ID, SET_PROJECT_ID, STORE_KEY } from '../constant'

import { FilePathNodeSearch, notify } from '@/figmaPluginUtils'
import { getNodeData } from './TextPluginDataModel'
import { getAllStyleRanges } from '@/figmaPluginUtils/text'

export const currentPointerSignal = signal<CurrentCursorType | null>(null)
export const projectIdSignal = signal<string>('')

// inspect 모드에서 figma.fileKey가 없기 때문에 프로젝트 아이디를 STORE_KEY에 추가함

export const getProjectId = () => {
	const fileKey = figma.fileKey
	if (fileKey) {
		return fileKey
	}

	const key = figma.root.getPluginData(STORE_KEY.PROJECT_ID)
	if (key) {
		return key
	}

	notify('editor 최초 설정 필요', 'error')
}

export const onGetProjectId = () => {
	on(GET_PROJECT_ID.REQUEST_KEY, () => {
		console.log('🚀 ~ onGetProjectId ~ projectId:')
		const projectId = getProjectId()

		if (projectId) {
			emit(GET_PROJECT_ID.RESPONSE_KEY, projectId)
		}
	})
}

export const onSetProjectId = () => {
	return on(SET_PROJECT_ID.REQUEST_KEY, (projectId: string) => {
		console.log('🚀 ~ onSetProjectId ~ projectId:', projectId)
		figma.root.setPluginData(STORE_KEY.PROJECT_ID, projectId)
		emit(GET_PROJECT_ID.RESPONSE_KEY, projectId)
	})
}

export const onSetProjectIdResponse = () => {
	emit(GET_PROJECT_ID.REQUEST_KEY)
	return on(GET_PROJECT_ID.RESPONSE_KEY, (projectId: string) => {
		console.log('🚀 ~ onSetProjectIdResponse ~ projectId:', projectId)
		projectIdSignal.value = projectId
	})
}

export const getCursorPosition = async (node: BaseNode) => {
	if (node && node.type === 'TEXT') {
		const result = FilePathNodeSearch(node)

		// 첫번째 섹션
		const sectionNode = result.find((node) => node.type === 'SECTION')
		// if (!sectionNode) {
		// 섹션이 없을 때 제약을 줄 것인가 여부
		// 	return
		// }

		const projectId = getProjectId()
		if (!projectId) {
			return
		}
		const NodeData = await getNodeData(node)
		console.log('🚀 ~ getCursorPosition ~ node:', node)

		console.log({
			'전체 텍스트': node.characters,
			'수정 여부': node.autoRename,
			'스타일 데이터': getAllStyleRanges(node),
		})

		const cursorPosition: CurrentCursorType = {
			projectId,
			sectionName: sectionNode?.name ?? '',
			sectionId: sectionNode?.id ?? '',
			pageName: figma.currentPage.name,
			pageId: figma.currentPage.id,
			nodeName: node.name,
			nodeId: node.id,
			characters: node.characters,
			autoRename: node.autoRename,
			data: NodeData,
		}

		return cursorPosition
	}
}

export const onNodeSelectionChange = () => {
	figma.on('selectionchange', async () => {
		const node = figma.currentPage.selection[0]
		const cursorPosition = await getCursorPosition(node)
		emit(GET_CURSOR_POSITION.RESPONSE_KEY, cursorPosition)
	})
}

/** Main */
export const onGetCursorPosition = () => {
	on(GET_CURSOR_POSITION.REQUEST_KEY, async () => {
		const node = figma.currentPage.selection[0]
		const cursorPosition = await getCursorPosition(node)
		emit(GET_CURSOR_POSITION.RESPONSE_KEY, cursorPosition)
	})
}

/** UI */
export const onGetCursorPositionResponse = () => {
	emit(GET_CURSOR_POSITION.REQUEST_KEY)
	return on(GET_CURSOR_POSITION.RESPONSE_KEY, (cursorPosition: CurrentCursorType) => {
		currentPointerSignal.value = cursorPosition
	})
}
