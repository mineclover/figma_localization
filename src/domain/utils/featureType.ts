/** 화면 이동 */
export type ViewMoveType = {
	pageId: string
	nodeId: string
}

/** 현재 커서 정보 */
export type CurrentCursorType = {
	projectId: string
	sectionName: string
	sectionId: string

	pageName: string
	pageId: string
	nodeName: string
	nodeId: string
}
