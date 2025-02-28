/**
 * 검색 순서
 * 일단 해당 페이지에서 전체 텍스트 조회
 * 또는 해당 섹션에서 전체 텍스트 조회
 * 1. 아이디
 * 2. 로컬라이제이션 키 값
 * 3. 상위 레이어 이름
 * 4. 문자열
 * 5. 스타일 이름?
 *
 *
 *
 *
 * 선택 된 섹션 노드 정보를 기억해야한다
 * 작업 중인 영역의 정보를 기억해야한다는 의미임
 */

import { emit, on } from '@create-figma-plugin/utilities'
import { GET_PATTERN_MATCH_KEY, NODE_STORE_KEY } from '../constant'
import { signal } from '@preact/signals-core'

export type SearchNodeData = {
	id: string
	name: string
	ignore: boolean
	localizationKey: string
	text: string
	parentName: string
}

export type PatternMatchData = Omit<SearchNodeData, 'id'> & {
	ids: string[]
}

export const patternMatchDataSignal = signal<SearchNodeData[]>([])

export const onPatternMatch = () => {
	on(GET_PATTERN_MATCH_KEY.REQUEST_KEY, async (targetID: string) => {
		// 일단 선택된 섹션 관리
		figma.skipInvisibleInstanceChildren = true
		const selection = await figma.getNodeByIdAsync(targetID)

		if (selection == null || selection.type !== 'SECTION') {
			return
		}

		const nodeArr = selection.findAllWithCriteria({
			types: ['TEXT'],
		})
		const dataArr = nodeArr.map((node) => {
			return {
				id: node.id,
				name: node.name,
				ignore: node.getPluginData(NODE_STORE_KEY.IGNORE) === 'true',
				localizationKey: node.getPluginData(NODE_STORE_KEY.LOCALIZATION_KEY),
				text: node.characters,
				parentName: node.parent?.name ?? '',
			} as SearchNodeData
		})
		emit(GET_PATTERN_MATCH_KEY.RESPONSE_KEY, dataArr)
	})
}

export const onPatternMatchResponse = () => {
	on(GET_PATTERN_MATCH_KEY.RESPONSE_KEY, (dataArr: SearchNodeData[]) => {
		patternMatchDataSignal.value = dataArr
	})
}

/**
 * SearchNodeData 배열을 받아 id를 제외한 나머지 필드가 동일한 항목끼리 그룹화하여
 * PatternMatchData 배열로 변환합니다
 */
export const groupByPattern = (dataArr: SearchNodeData[]): PatternMatchData[] => {
	const groupMap = new Map<string, PatternMatchData>()

	dataArr.forEach((item) => {
		// id를 제외한 필드를 기준으로 고유 키 생성
		const key = JSON.stringify({
			name: item.name,
			ignore: item.ignore,
			localizationKey: item.localizationKey,
			text: item.text,
			parentName: item.parentName,
		})

		if (!groupMap.has(key)) {
			// 새 그룹 생성
			groupMap.set(key, {
				name: item.name,
				ignore: item.ignore,
				localizationKey: item.localizationKey,
				text: item.text,
				parentName: item.parentName,
				ids: [item.id],
			})
		} else {
			// 기존 그룹에 id 추가
			groupMap.get(key)!.ids.push(item.id)
		}
	})

	// Map 값들을 배열로 변환하여 반환
	return Array.from(groupMap.values())
}
