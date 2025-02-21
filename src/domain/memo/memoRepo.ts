import { constant, dataOn, duplexConcatWithType2, signalEmit } from '@/domain/interface'
import { FigmaUser, Memo, MEMO_KEY, MemoList, Memos, SectionID, SectionList } from '@/domain/types'
import { getSectionModel } from '../section/sectionRepo'
import { AddMemoType } from '../utils/featureType'
import { DuplexKeysType, duplexKeysAndSignal } from '../duplex'
import { dataMemosOn } from './memoAdapter'
import { publish } from '../system/sysyemRepo'

/** 다른 키 없이 빈 메모 */
type NullMemo = { key: MEMO_KEY }

export const getMemoModel = (key: MEMO_KEY) => {
	const data = figma.root.getPluginData(key)

	try {
		const memo = JSON.parse(data)
		return memo as Memo
	} catch (error) {
		return ''
	}
}

/**
 * 메모가 제대로 온 경우 true
 * @param memo
 * @returns
 */
export const memoCheck = (memo: Memo | NullMemo | AddMemoType | ''): memo is Memo => {
	if (memo === '') {
		return false
	}
	if ('key' in memo && Object.keys(memo).length === 1) {
		return false
	}
	return true
}

// 여기서 의문 섹션을 지우면 모든 메모에서 특정 백링크 삭제를 해야하는건데
// 이걸 구현하려하게되면 전체 조회 삭제를 해야함
// 이 리스트들 전부를 들고 있는 ui 메모에서 본인의 백링크를 삭제하는 것이 최소 접근이라 생각함
// 다수 접속 사용시 정합성이 깨지는 문제는
// 핀 포인트 수정으로 메모 내에 섹션백링크 리스트 검증 로직 넣으면 안전하게 구성가능할 듯

/**
 * 메모 삭제의 경우 메모 삭제기 때문에 무조건 섹션 리스트에서 삭제가 발생하므로 전체 섹션에서 특정 메모 삭제
 * 단일 대상 제어
 * 섹션 backLink에 최소 한개 이상 들어갈 거라 생각하는데...
 * 아직 구성이 애매하고 한 메모에 여러 색션이 들어가는 것에 대해 굳이 필요한지 의문
 *
 * @param key
 * @param memo
 * @returns 삭제된 섹션 리스트 반환
 */
export const setMemoModel = (key: MEMO_KEY, memo: Memo | AddMemoType | NullMemo) => {
	const currentMemo = getMemoModel(key)
	const currentSection = currentMemo === '' ? [] : (currentMemo.sectionBackLink ?? [])
	// 메모..

	const isAdd = currentMemo === ''

	// 추가를 위한 키 발급은 클라에서 랜덤 키 얻어서 감싸보내주기
	// 값 없는 것들은 기존에 없으면 생성 있으면 읽어옴
	// 메인에서 처리되는 건 동일하게 구성
	// 클라 데이터보다 메인 쪽에서 읽는 데이터가 더 신선함

	//
	// uuid 얻어오고
	// 이미 메모가 있으면 create는 기존 데이터 값 사용
	// modified는 현재 시간 사용

	// writer는 현재 유저 사용

	// 나머지 값은 새 값 기준으로 덮어씌움
	// 작성자 검증 추가
	// 즉 create 있으면 기존 데이터 사용

	// if (memoCheck(memo) && memo.sectionBackLink && memo.sectionBackLink.length > 0) {
	if (memoCheck(memo)) {
		const removedSections = currentSection.filter((section) => {
			try {
				if (!memo.sectionBackLink.includes(section)) return true
			} catch (e) {
				console.error('setMemoModel:80L', e)
			}
			return false
		})

		const time = new Date().getTime().toString()
		const created = isAdd ? time : currentMemo.created
		const modified = time

		figma.root.setPluginData(key, JSON.stringify({ ...memo, created, modified }))

		setMemoListModel([key], 'add')
		publish({
			memos: [key],
		})
		return removedSections
	} else {
		//
		figma.root.setPluginData(key, '')
		setMemoListModel([key], 'remove')
		publish({
			memos: [key],
		})
		return currentSection
	}
}

/**
 * 전체 메모 리스트 조회
 * @returns
 */
export const getMemoListModel = (memoList: MemoList) => {
	if (memoList.length < 1) {
		return
	}

	return memoList
		.map((key) => getMemoModel(key))
		.filter((item) => item !== '')
		.reduce((acc, memo) => {
			return { ...acc, [memo.key]: memo }
		}, {}) as Memos
}

/**
 * 전체 메모 리스트 조회
 * @returns
 */
export const getAllMemoListModel = () => {
	const memoList = figma.root.getPluginData(constant.memoList)
	if (memoList === '') {
		return []
	}
	return JSON.parse(memoList) as MEMO_KEY[]
}

/**
 * 메모 리스트 수정
 * @param input 추가할 메모 리스트
 * @param action 추가 또는 삭제
 */
export const setMemoListModel = (input: MEMO_KEY[], action: 'add' | 'remove') => {
	const before = getAllMemoListModel()

	if (action === 'add') {
		const after = [...before, ...input].filter((item, index, self) => self.indexOf(item) === index)
		figma.root.setPluginData(constant.memoList, JSON.stringify(after))
	} else if (action === 'remove') {
		const after = before.filter((item) => !input.includes(item))
		figma.root.setPluginData(constant.memoList, JSON.stringify(after))
	}
	publish({
		memos: input,
	})
}

/**
 * 메모리스트로 전체 메모 조회
 * 메모 생성은 UI에서 진행함
 * @returns
 */
export const getAllMemoListDataModel = () => {
	const memoList = getAllMemoListModel()
	return memoList
		.map((key) => getMemoModel(key))
		.filter((item) => item !== '')
		.reduce((acc, memo) => {
			return { ...acc, [memo.key]: memo }
		}, {}) as Memos
}

/**
 * 섹션아이디로 메모 리스트 조회
 * 섹션 단위로 업데이트함
 * @param key
 * @returns
 */
export const getSectionMemoListDataModel = (key: SectionID) => {
	const memoList = getSectionModel(key)
	if (memoList == null || memoList.length === 0) {
		return []
	}
	return memoList.map((item) => getMemoModel(item)).filter((item) => item !== '')
}

export const clientMemoEmit = () => {
	const signalKey = duplexConcatWithType2('signal', 'memos')
	const dataKey = duplexConcatWithType2('data', 'memos')

	const event = dataMemosOn('DATA_memos', (args) => {
		// 기존 데이터 확인
		const before = { ...duplexKeysAndSignal.memos.value }
		for (const key in args) {
			const memo = args[key]
			if (memo.key === '') {
				delete before[key]
			} else {
				before[key] = memo
			}
		}
		duplexKeysAndSignal.memos.value = before
	})

	signalEmit(signalKey)
	return event
}
