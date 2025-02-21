import { constant, prefix } from '../interface'
import { publish } from '../system/sysyemRepo'
import { MemoCategoryList } from '../types'
import { getUserModel } from '../user/userRepo'

const DefaultCategory: MemoCategoryList = {
	Plan: '기획이나 레퍼런스',
	Design: '디자인 관련',
	Develop: '개발 내역',
	Resource: '저장 위치',
	Deploy: '서비스 실제 배포 위치',
}

export const setMainCategory = (category: MemoCategoryList) => {
	figma.root.setPluginData(constant.category, JSON.stringify(category))
	publish({
		category: Object.keys(category),
	})
}

export const getMainCategory = () => {
	const category = figma.root.getPluginData(constant.category)
	if (!category) {
		setMainCategory(DefaultCategory)
		return DefaultCategory
	}
	return JSON.parse(category) as MemoCategoryList
}
