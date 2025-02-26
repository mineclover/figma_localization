import { signal } from '@preact/signals-core'
import { CurrentCursorType } from '../utils/featureType'
import { emit, on } from '@create-figma-plugin/utilities'
import {
	CURRENT_SECTION_SELECTED,
	GET_CURSOR_POSITION,
	GET_LOCALIZATION_KEY_VALUE,
	GET_PROJECT_ID,
	NODE_STORE_KEY,
	SET_PROJECT_ID,
	STORE_KEY,
} from '../constant'

import { FilePathNodeSearch, notify } from '@/figmaPluginUtils'
import { getNodeData, processTextNodeLocalization } from './TextPluginDataModel'
import { getAllStyleRanges } from '@/figmaPluginUtils/text'
import { fetchDB } from '../utils/fetchDB'
import { ERROR_CODE } from '../errorCode'
import { removeLeadingSymbols } from '@/utils/textTools'
import { getCurrentSectionSelected } from '../Translate/TranslateModel'

export const currentPointerSignal = signal<CurrentCursorType | null>(null)
export const projectIdSignal = signal<string>('')

// inspect 모드에서 figma.fileKey가 없기 때문에 프로젝트 아이디를 STORE_KEY에 추가함

export type SectionDTO = {
	section_id: number
	section_name: string
	domain_id: number
	doc_link: string
	created_at: string
	updated_at: string
	code?: string
}

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
		const projectId = getProjectId()

		if (projectId) {
			emit(GET_PROJECT_ID.RESPONSE_KEY, projectId)
		}
	})
}

export const onSetProjectId = () => {
	return on(SET_PROJECT_ID.REQUEST_KEY, (projectId: string) => {
		figma.root.setPluginData(STORE_KEY.PROJECT_ID, projectId)
		emit(GET_PROJECT_ID.RESPONSE_KEY, projectId)
	})
}

export const onSetProjectIdResponse = () => {
	emit(GET_PROJECT_ID.REQUEST_KEY)
	return on(GET_PROJECT_ID.RESPONSE_KEY, (projectId: string) => {
		projectIdSignal.value = projectId
	})
}

export const sectionNameParser = (text: string) => {
	const regex = /^\[(.*?)\]/
	const matches = regex.exec(text)
	if (matches) {
		if (matches[1] === 'undefined') {
			return null
		}
		return matches[1]
	}
	return null
}

/**
 * 이 코드가 너무 많은 기능을 갖고 있어서 리펙토링 하게 되면 수정하면 좋을 것 같음
 */
export const getCursorPosition = async (node: BaseNode) => {
	const sectionData = {
		section_id: 0,
		name: 'DEFAULT',
	}
	if (node && node.type === 'TEXT') {
		const result = FilePathNodeSearch(node)

		// 첫번째 섹션
		const sectionNode = result.find((node) => node.type === 'SECTION')

		if (sectionNode) {
			// 1. 이름이 [abc] 처럼 되있다면 섹션 아이디 추출
			// 1-1 해당 이름으로 검색 > 있으면 섹션 데이터 플러그인 데이터에 오버라이드
			const text = sectionNode.name.trim()

			const sectionName = sectionNameParser(text)
			if (sectionName) {
				const result = await fetchDB(('/sections/' + sectionName) as '/sections/{name}', {
					method: 'GET',
					// body: JSON.stringify({ name: sectionName }, null, 2),
				})
				if (!result) {
					return
				}
				const data = (await result.json()) as SectionDTO

				// 값이 정상일 때 이름과 섹션 이름 수정
				if (data && result.status !== 404) {
					const nextText = text.replace(`[${sectionName}]`, '').trim()
					sectionData.section_id = data.section_id
					sectionData.name = `[${data.section_name}] ${nextText}`
					sectionNode.setPluginData(NODE_STORE_KEY.SECTION, data.section_id.toString())
				}
			}
			//
			// 2. 섹션이 존재하고 플러그인 데이터가 존재하면
			// 2-1 플러그인 데이터를 이름에 부여 ( 개발자 플러그인 데이터 오버라이드 ? 인데 개발자모드 쓰는 사람이 없다는 )
			// 섹션 리스트를 글로벌로 끌어올리는 것도 고려 대상
			else {
				const sectionId = sectionNode?.getPluginData(NODE_STORE_KEY.SECTION)
				if (sectionId) {
					sectionData.section_id = parseInt(sectionId)
					const result = await fetchDB(('/sections/id/' + sectionId) as '/sections/id/{id}', {
						method: 'GET',
						// body: JSON.stringify({ name: sectionName }, null, 2),
					})
					if (!result) {
						return
					}
					const data = (await result.json()) as SectionDTO

					if (data && data.code !== ERROR_CODE.SECTION_NOT_FOUND) {
						sectionData.section_id = data.section_id
						sectionData.name = `[${data.section_name}] ${text}`
						sectionNode.name = sectionData.name
					}
				}
			}
		}

		const projectId = getProjectId()
		if (!projectId) {
			return
		}
		const NodeData = getNodeData(node)

		const cursorPosition: CurrentCursorType = {
			projectId,
			sectionName: sectionData.name,
			sectionId: sectionData.section_id,
			pageName: figma.currentPage.name,
			pageId: figma.currentPage.id,
			nodeName: removeLeadingSymbols(node.name),
			nodeId: node.id,
			characters: node.characters,
			autoRename: node.autoRename,
			data: NodeData,
			styleData: getAllStyleRanges(node),
		}

		return cursorPosition
	}
}

let tempNode = ''

export const onNodeSelectionChange = () => {
	figma.on('selectionchange', async () => {
		const node = figma.currentPage.selection[0]
		/** 업데이트 반영 코드 */
		if (tempNode !== node.id) {
			tempNode = node.id
			const cursorPosition = await getCursorPosition(node)
			emit(GET_CURSOR_POSITION.RESPONSE_KEY, cursorPosition)
			const localizationKey = await processTextNodeLocalization(node)
			emit(GET_LOCALIZATION_KEY_VALUE.RESPONSE_KEY, localizationKey)

			const sectionId = getCurrentSectionSelected(node)
			emit(CURRENT_SECTION_SELECTED.RESPONSE_KEY, sectionId)
		}
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
