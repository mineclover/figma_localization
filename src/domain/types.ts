export type UUID = string
export type MEMO_KEY = string
/**
 * 섹션 고유 식별 아이디
 * 계층 구조적 주소를 아이디로 씀
 * 고유키를 따로 줘야할지 고민하고 있음
 *
 */
export type SectionID = string

export type FigmaUser = {
	uuid: UUID
	name: string
}
export type Users = {
	[key: FigmaUser['uuid']]: FigmaUser['name']
}

/** {페이지아이디}:{노드아이디} */
export type ComponentKey = string

export type Memo = {
	key: MEMO_KEY
	url: string
	category: string
	title: string
	description: string
	sectionBackLink: string[]
	componentLink: ComponentKey[]
	writer: UUID
	created?: number
	modified?: number
}
/**
 * 고유하게 전체 메모 리스트를 저장
 * 1.1.1 : [memokey1, memokey2]
 * 처럼 존재한다는 것을 알 수 있음
 */
export type MemoList = MEMO_KEY[]

export type Memos = Record<MEMO_KEY, Memo>

/**
 * 1.1.1 : [memokey1, memokey2]
 * 처럼 존재한다는 것을 알 수 있음
 */
export type Section = Record<SectionID, MEMO_KEY[]>

/**
 * 아이디 리스트를 저장
 * [1.1.1, 1.1.2]
 */
export type SectionList = SectionID[]

export type CurrentSectionInfo = {
	id: string
	name: string
	// type: (typeof linkPathNodeType)[number]
	type: string
	alias: string
}

export type MemoCategoryKey = string

/**
 * key를 카테고리로 value를 설명으로 구성하는게 더 좋을 것 같음
 */
export type MemoCategoryList = Record<MemoCategoryKey, string>

// 전체 유저리스트 관리하고
// 그 유저 아이디 기반으로 개별 펍 만들어서 엑세스
export type Pub = {
	memos: MEMO_KEY[]
	category: MemoCategoryKey[]
	section: SectionID[]
	users: FigmaUser['uuid'][]
}

export type FocusType = 'all' | 'page' | 'section' | 'node'

export type FocusModeType = Exclude<FocusType, 'all' | 'node'>
