import { constant } from '@/domain/interface'
import { FigmaUser, Users } from '@/domain/types'
import { publish } from '../system/sysyemRepo'
import { generateUUID } from '../interfaceBuilder'

export const getAllUser = () => {
	const before = figma.root.getPluginData(constant.allUser)
	return before === '' ? {} : (JSON.parse(before) as Users)
}

export const updateAllUser = ({ uuid, name }: FigmaUser) => {
	const users = getAllUser()
	const after = { ...users, [uuid]: name }
	figma.root.setPluginData(constant.allUser, JSON.stringify(after))
	// 마땅히 트리거가 없다
}

/** 다른 프로젝트 간 데이터 흭득을 위해 사용됨 */
export const getUserModel = async () => {
	// 다른 곳에서도 동일한 uuid를 쓰도록 함
	const nameR = await figma.clientStorage.getAsync('name')
	const name = nameR ?? ''
	const uuidR = await figma.clientStorage.getAsync('uuid')

	const needUUID = uuidR === '' || uuidR == null

	const uuid = needUUID ? generateUUID() : uuidR
	if (needUUID) {
		figma.clientStorage.setAsync('uuid', uuid)
	}

	updateAllUser({ uuid, name })

	return { uuid, name } as FigmaUser
}

export const setUserName = (name: string) => {
	figma.clientStorage.setAsync('name', name)
	figma.clientStorage.getAsync('uuid').then((uuid) => {
		publish({
			users: [uuid],
		})
	})
}
