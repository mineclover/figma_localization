import { signal } from '@preact/signals-core'
import { MEMO_KEY, Memos, Memo } from '../types'

//
/**
 * 섹션 아이디 리스트 조회
 * 아이디에서 메모 아이디로 메모 조회
 * 섹션 키 기반으로 전체 메모들이 저장되어있는 걸 가지고 있음
 * 조회를 줄여야하면 일단 이름으로 필터링하고
 * 섹션 아톰 역할은?
 * 전체 섹션 리스트 저장하기
 *
 */

export const memoListAtom = signal<MEMO_KEY[]>([])
export const memosAtom = signal<Memos>({})
export const memoAtom = signal<Memo>({
	writer: '',
	key: '',
	url: '',
	sectionBackLink: [],
	componentLink: [],
	category: '',
	title: '',
	created: Date.now(),
	modified: Date.now(),
	description: '',
})
