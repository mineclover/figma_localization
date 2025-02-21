import { generateRandomText2 } from '@/utils/textTools'
import { constant, dataEmit, prefix, signalEmit } from '@/domain/interface'
import { FigmaUser, Pub } from '@/domain/types'
import { getAllUser, getUserModel } from '../user/userRepo'
import { getMemoListModel, getMemoModel } from '../memo/memoRepo'
import { uiDuplexEmit } from '../Provider'
import { dataMemosEmit, dataSectionEmit } from '../memo/memoAdapter'
import { getMainCategory } from '../category/categoryRepo'
import { dataCategoryEmit } from '../category/categoryAdapter'
import { getAllSectionListModel, getSectionListModel } from '../section/sectionRepo'
import { dataAllUserEmit } from '../user/userAdapter'

const defaultPub = {
	memos: [],
	category: [],
	section: [],
	users: [],
} as Pub

/**
 * 특정 아이디 펍 얻기
 *  */
export const getTargetPub = (uuid: string): Pub => {
	const userPubKey = prefix['pub'] + uuid
	const stringData = figma.root.getPluginData(userPubKey)
	if (stringData === '') {
		figma.root.setPluginData(userPubKey, JSON.stringify(defaultPub))
	}
	const pub = stringData === '' ? defaultPub : JSON.parse(stringData)
	return pub
}
/** 자신의 pub 얻기 () */
export const getCurrentPub = async () => {
	const user = await getUserModel()
	return getTargetPub(user.uuid)
}

export const pubCheck = (pub: Pub) => {
	return Object.values(pub).some((arr) => arr.length > 0)
}
export const pubClear = async () => {
	const user = await getUserModel()
	figma.root.setPluginData(prefix['pub'] + user.uuid, JSON.stringify(defaultPub))
}

/** 특정 대상에게 저장 */
const addPub = (uuid: string, newData: Partial<Pub>) => {
	const pub = getTargetPub(uuid)
	const nextPub = Object.entries(newData).reduce((prev, [key, value]) => {
		// 추가할 때 중복 제거해서 추가
		prev[key as keyof Pub] = [...prev[key as keyof Pub], ...value].filter((t, index, arr) => arr.indexOf(t) === index)
		return prev
	}, pub)

	const userPubKey = prefix['pub'] + uuid
	figma.root.setPluginData(userPubKey, JSON.stringify(nextPub))
}

/**
 * 데이터 변경 사항 발생 전파
 * 배열로 전달하면 알아서 중복 제거하면서 병합
 */
export const publish = (pub: Partial<Pub>) => {
	const users = getAllUser()
	for (const uuid of Object.keys(users)) {
		addPub(uuid, pub)
	}
}

// 이벤트 생기고 뭐하고 어쩌고 저쩌고
// 유저가 펍 업데이트 요청하는 시그널을 보내면
// get Memo , category, user name, sectionID 등을 해서 보내준다
// 등록된 만큼

export const mainPubSignal = (pub: Partial<Pub>) => {
	console.log('mainPubSignal', pub)
	for (const [key, value] of Object.entries(pub)) {
		if (value.length === 0) continue

		if (key === 'memos') {
			const res = getMemoListModel(value)
			if (res) dataMemosEmit('DATA_memos', res)
		}
		if (key === 'category') {
			// 카테고리 쪽은 데이터가 많지 않아서 그냥 덮어 씌움
			const res = getMainCategory()
			if (res) dataCategoryEmit('DATA_category', res)
		}
		if (key === 'section') {
			const res = getSectionListModel(value)
			if (res) dataSectionEmit('DATA_section', res)
		}
		if (key === 'allUser') {
			const res = getAllUser()
			if (res) dataAllUserEmit('DATA_allUser', res)
		}
	}
}
