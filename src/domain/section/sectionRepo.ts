import { generateRandomText2 } from '@/utils/textTools'
import { constant, prefix, selectedType } from '@/domain/interface'
import { CurrentSectionInfo, FigmaUser, FocusType, MEMO_KEY, Section, SectionID, SectionList } from '@/domain/types'
import { getMemoModel, memoCheck, setMemoModel } from '../memo/memoRepo'
// FilePathNodeSearch 모듈 경로 수정
import { FilePathNodeSearch, linkPathNodeType } from '@/figmaPluginUtils'
import { publish } from '../system/sysyemRepo'

/** 데이터 수정을 덮어씌우는 것보다 지정 키를 없애는 것이 좋음 */
export const getSectionModel = (key: SectionID) => {
	const data = figma.root.getPluginData(key)
	if (data === '') {
		return
	}
	const memoList = JSON.parse(data) as MEMO_KEY[]
	if (!Array.isArray(memoList)) {
		// 이상한 값일 경우 제거
		setSectionModel(key, '')
	}
	return memoList
}

// TODO: 검색 필터 로직은 나중에
/**
 * 섹션 리스트 저장
 * @returns 저장 값 반환 ( 로직에서 데이터가 흐르게 구성해봤음 )
 */
export const setSectionListModel = (input: SectionList) => {
	figma.root.setPluginData(constant.sectionList, JSON.stringify(input))
	publish({
		section: input,
	})
	return input
}

export const getAllSectionListModel = () => {
	const sectionList = figma.root.getPluginData(constant.sectionList)
	if (sectionList === '') {
		return []
	}
	return JSON.parse(sectionList) as SectionList
}

/** 리스트 내 데이터 조회 */
export const getSectionListModel = (list: SectionList) => {
	const sectionList = list.reduce((prev, text) => {
		const sectionMemo = getSectionModel(text)
		if (sectionMemo) {
			return {
				...prev,
				[text]: sectionMemo,
			}
		}
		return {}
	}, {} as Section)

	return sectionList
}

/** 하나의 노드만 선택되었을 때 */
export const getOneCurrentSelection = () => {
	if (figma.currentPage.selection.length === 1) {
		const node = figma.currentPage.selection[0]
		return node
	}

	return null
}

export const getCurrentPage = () => {
	return figma.currentPage
}

export const getCurrentSectionModel = (node: BaseNode) => {
	if (node) {
		const paths = FilePathNodeSearch(node)
		const sectionInfo: CurrentSectionInfo[] = paths.map((node) => {
			const isPathNode = linkPathNodeType.includes(node.type as (typeof linkPathNodeType)[number])
			console.log('getCurrentSectionModel map', node, node.type, linkPathNodeType, isPathNode)
			// 섹션 구성에 컴포넌트를 저장하려할 때

			return {
				id: node.id,
				name: node.name,
				type: isPathNode ? node.type : 'SELECTED',
				alias: node.getPluginData(constant.alias),
			}
		})
		return sectionInfo
	}
	//메세지 처리하거나 무시하거나 데이터가 없으면 처리하지 않게하는게 맞다

	return null
}

export const setCurrentSectionModel = async (input: CurrentSectionInfo[]) => {
	for (const item of input) {
		const node = await figma.getNodeByIdAsync(item.id)

		if (node) {
			node.setPluginData(constant.alias, item.alias)
		}
	}
}

/**
 * 등록된 모든 섹션 리스트 조회 하고
 * 빈 섹션은 제거
 */
export const clearAllSectionListModel = () => {
	const sectionList = getAllSectionListModel()
	// 조회
	// 이건 전체 섹션 생성하면
	const entries = sectionList
		.map((sectionKey) => [sectionKey, getSectionModel(sectionKey)])
		.filter((item) => item[1] !== '')

	const allSection = Object.fromEntries(entries) as Section
	const newSectionList = Object.keys(allSection)
	// 빈 섹션 제거
	setSectionListModel(newSectionList)
	publish({
		section: newSectionList,
	})
	return newSectionList
	// allSection
}

export const getAllSectionDataModel = () => {
	const sectionList = clearAllSectionListModel()
	const allSection = Object.fromEntries(
		sectionList.map((sectionKey) => [sectionKey, getSectionModel(sectionKey)])
	) as Section
	return allSection
}

export const setSectionModel = (key: SectionID, input: SectionList | '') => {
	console.log('setSection', input)
	// 섹션 리스트에서 일부 데이터를 지우는 것을 어떻게 처리하는가
	// 메모가 사라지고 섹션 리스트에도 사라지는 것의 연쇄 반응일 것이다
	// 즉 일반적으로 setSectionModel은 실행되지 않을 것임
	// 섹션이 지워졌을 때 메모들에 섹션들에 대한 삭제 전파가 되야한다
	if (input === '') {
		const before = getSectionModel(key)
		if (before == null) {
			// 없어서 지울게 없음
			// figma.root.setPluginData(key, '')
			return
		}

		before.forEach((memoKey) => {
			console.log('memoKey', memoKey)
			const memo = getMemoModel(memoKey)
			// 섹션 백링크 제거...
			if (memoCheck(memo)) {
				try {
					memo.sectionBackLink = memo.sectionBackLink?.filter((link) => link !== key)
					setMemoModel(memoKey, memo)
				} catch (e) {
					console.error('setSectionModel:156L', e)
				}
			}
			// 메모 내에 섹션 백링크에서 해당 섹션 키 제거
		})

		// 이후 섹션 리스트 자체를 제거
		figma.root.setPluginData(key, '')
	} else {
		figma.root.setPluginData(key, JSON.stringify(input))
	}
	if (key) {
		publish({
			section: [key],
		})
	}
}

export const getPageId = (currentSection: CurrentSectionInfo[]) => {
	return currentSection.filter((section) => section.type === 'PAGE')[0]?.id ?? ''
}
export const getNodeId = (currentSection: CurrentSectionInfo[]) => {
	return currentSection.filter((section) => section.type === selectedType)[0]?.id ?? ''
}

/**
 * main에서 얻은 CurrentSectionInfo 를 기반으로 데이터를 파싱하는 도구임
 * 파싱되는 것의 순서는 page > [...section] > (node) 임
 * 섹션에서 내려올 때 아마도 첫 섹션이겠지만 /로 시작할 수 있음
 * 내가 원하는 기능은 경로에서 첫 시작이 /로 시작하는게 있을 경우
 * /보다 앞에있는 currentSection 을 제거한 상태로 section key를 완성하는 것
 */
export const getRootSection = (currentSection: CurrentSectionInfo[]) => {
	return currentSection.reduce((acc, cur, index, arr) => {
		const context = cur.alias === '' ? cur.name : cur.alias
		if (context.startsWith('/')) {
			const newCur = {
				...cur,
				alias: '',
				name: context.slice(1),
			}

			return [newCur]
		}
		acc.push(cur)
		return acc
	}, [] as CurrentSectionInfo[])
}

/** rootSection 을 기반으로 옵션에 따라 키를 문자열로 뽑는 함수 */
export const getSectionKey = (currentSection: CurrentSectionInfo[], option: FocusType) => {
	console.log('getSectionKey', currentSection)

	// 그래서 구성을 이렇게 함
	const rootSection = getRootSection(currentSection)

	if (option === 'page') {
		const sections = currentSection.filter((section) => section.type === 'PAGE')
		return sections
			.map((section) => {
				const context = section.alias === '' ? section.name : section.alias
				return context
			})
			.join('/')
	}
	if (option === 'section') {
		const sections = rootSection.filter((section) => section.type !== selectedType)
		return sections
			.map((section) => {
				const context = section.alias === '' ? section.name : section.alias
				return context
			})
			.join('/')
	}
	if (option === 'node') {
		return rootSection
			.map((section) => {
				const context = section.alias === '' ? section.name : section.alias
				return context
			})
			.join('/')
	}
	// all
	return ''
}
