import { signal } from '@preact/signals-core'
import { CurrentCursorType } from '../utils/featureType'
import { emit, on } from '@create-figma-plugin/utilities'
import { GET_CURSOR_POSITION, SET_CURSOR_POSITION, SET_PROJECT_ID, STORE_KEY } from '../constant'
import { getFigmaRootStore, setFigmaRootStore } from '../utils/getStore'
import { FileMetaSearch, FilePathNodeSearch, FilePathSearch, notify } from '@/figmaPluginUtils'

export const currentPointerSignal = signal<CurrentCursorType | null>(null)

// inspect 모드에서 figma.fileKey가 없기 때문에 프로젝트 아이디를 STORE_KEY에 추가함

const getFileKey = () => {
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

export const onSetFileKey = () => {
	on(SET_PROJECT_ID.REQUEST_KEY, (projectId: string) => {
		figma.root.setPluginData(STORE_KEY.PROJECT_ID, projectId)
	})
}

/** Main */
export const onGetCursorPosition = () => {
	on(GET_CURSOR_POSITION.REQUEST_KEY, () => {
		const temp = figma.currentPage.selection[0]

		if (temp && temp.type === 'TEXT') {
			const result = FilePathNodeSearch(temp)

			// 첫번째 섹션
			const sectionNode = result.find((node) => node.type === 'SECTION')
			if (!sectionNode) {
				return
			}

			const projectId = getFileKey()
			if (!projectId) {
				return
			}

			const cursorPosition: CurrentCursorType = {
				projectId,
				sectionName: sectionNode.name,
				sectionId: sectionNode.id,
				pageName: figma.currentPage.name,
				pageId: figma.currentPage.id,
				nodeName: temp.name,
				nodeId: temp.id,
			}
			emit(GET_CURSOR_POSITION.RESPONSE_KEY, cursorPosition)
		}
	})
}

/** UI */
export const onGetCursorPositionResponse = () => {
	return on(GET_CURSOR_POSITION.RESPONSE_KEY, (cursorPosition: CurrentCursorType) => {
		currentPointerSignal.value = cursorPosition
	})
}
