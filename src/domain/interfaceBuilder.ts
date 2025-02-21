import { generateRandomText2 } from '@/utils/textTools'
import { prefix, selectedType, splitSymbol } from './interface'
import { CurrentSectionInfo } from './types'

/** 컴포넌트 키 추출 */
export const getCurrentSectionToComponentKey = (
	currentSection: CurrentSectionInfo[],
	type: 'section' | 'page' | 'node'
) => {
	const section = currentSection.filter((section) => section.type === 'SECTION')
	const page = currentSection.filter((section) => section.type === 'PAGE')
	const node = currentSection.filter((section) => section.type === selectedType)

	console.log('currentSection', currentSection)
	console.log('section', section)
	console.log('page', page)
	console.log('node', node)

	if (type === 'page') {
		if (page.length > 0) {
			return page[0].id
		}
		return null
	}

	if (type === 'node') {
		if (node.length > 0) {
			return componentKeyBuilder(page[0].id, node[0].id)
		}
		// 노드가 없으면 섹션 베이스로 생성
	}
	if (section.length > 0) {
		const lastSection = section.at(-1)
		if (lastSection) {
			return componentKeyBuilder(page[0].id, lastSection.id)
		}
	} else if (page.length > 0) {
		return page[0].id
	}
	return null
}

/** 섹션 명으로 쓸 이름 추출 */
export const getCurrentSectionToComponentName = (
	currentSection: CurrentSectionInfo[],
	type: 'section' | 'page' | 'node'
) => {
	const section = currentSection.filter((section) => section.type === 'SECTION')
	const page = currentSection.filter((section) => section.type === 'PAGE')
	const node = currentSection.filter((section) => section.type === selectedType)

	console.log('currentSection', currentSection)
	console.log('section', section)
	console.log('page', page)
	console.log('node', node)

	if (type === 'page') {
		if (page.length > 0) {
			return page[0].name
		}
		return null
	}

	if (type === 'node') {
		if (node.length > 0) {
			return '[' + page[0].name + ']' + node[0].name
		}
		// 노드가 없으면 섹션 베이스로 생성
	}
	if (section.length > 0) {
		const lastSection = section.at(-1)
		if (lastSection) {
			return '[' + page[0].name + ']' + lastSection.name
		}
	} else if (page.length > 0) {
		return page[0].name
	}
	return null
}

export const componentKeyBuilder = (pageId: string, nodeId: string) => {
	// return `${prefix.component}${pageId}${splitSymbol}${nodeId}`
	return `${pageId}${splitSymbol}${nodeId}`
}

export const componentKeyParser = (key: string) => {
	const [pageId, nodeId] = key.split(splitSymbol)
	if (pageId && nodeId) {
		return { pageId, nodeId }
	}
	return null
}

export const generateMemoKey = () => {
	return prefix.memo + generateRandomText2()
}
export const generateUUID = () => {
	return prefix['user'] + generateRandomText2()
}
