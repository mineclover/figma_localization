import { signal } from '@preact/signals-core'
import { MemoCategoryList } from '../types'

export const categoryAtom = signal<MemoCategoryList>({})

// ui에서만 쓰는 건 굳이 duplex에 넣을 필요 없음
export const currentCategoryAtom = signal<string>('fix')

export const hotTopic = {
	// fix: '핀 고정 메뉴',
	// add: '메뉴 추가',
	setting: '설정 창',
	all: '전체 메뉴',
} as const
