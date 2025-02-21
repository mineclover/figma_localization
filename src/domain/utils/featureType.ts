import { MEMO_KEY, UUID } from '../types'

/** 화면 이동 */
export type ViewMoveType = {
	pageId: string
	id: string
}

/** 메모 추가 */
export type AddMemoType = {
	key: MEMO_KEY
	url: string
	category: string
	title: string
	description: string
	// ui 쪽에서 흭득
	sectionBackLink: string[]
	componentLink: string[]
	// main 쪽에서 생성
	writer: UUID
	// writer: string? 이건 .. 좀 애매한데
	// created: string
	// modified: string
}
