import { Memo, Memos } from '../types'

export const memoService = (memos: Memos, prefix: string) => {
	const memosKey = Object.keys(memos).filter((memo) => memo.startsWith(prefix))

	const memoList = memosKey.map((memo) => memos[memo])
	return memoList
}
