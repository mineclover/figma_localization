import { MEMO_KEY, UUID } from '../types'

/** 화면 이동 */
export type ViewMoveType = {
	pageId: string
	nodeId: string
}

/** 현재 커서 정보 */
export type CurrentCursorType = {
	sectionName: string
	sectionId: string

	pageName: string
	pageId: string
	nodeName: string
	nodeId: string
}
