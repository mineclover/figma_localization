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
import { GET_PATTERN_MATCH_KEY, NODE_STORE_KEY, SET_NODE_LOCALIZATION_KEY_BATCH } from '../constant'
import { signal } from '@preact/signals-core'
import {
	addTranslation,
	allRefresh,
	processTextNodeLocalization,
	reloadOriginalLocalizationName,
	setNodeData,
} from '../Label/TextPluginDataModel'
import { notify } from '@/figmaPluginUtils'

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
	on(GET_PATTERN_MATCH_KEY.REQUEST_KEY, async (targetID?: string) => {
		// 일단 선택된 섹션 관리
		figma.skipInvisibleInstanceChildren = true

		if (targetID) {
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
		} else {
			const selection = figma.currentPage

			if (selection == null || selection.type !== 'PAGE') {
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
		}
	})
}

export const onPatternMatchResponse = () => {
	on(GET_PATTERN_MATCH_KEY.RESPONSE_KEY, (dataArr: SearchNodeData[]) => {
		patternMatchDataSignal.value = dataArr
	})
}

export type GroupOption = {
	localizationKey: true
	/** 부모 이름을 그루핑 파라미터로 사용 */
	parentName: true
	/** 이름을 그루핑 파라미터로 사용 */
	name: true
	/** 텍스트를 그루핑 파라미터로 사용 */
	text: true
}
export type ViewOption = {
	/** 숨김 대상을 표시 */
	ignore: boolean
	/** 숨기지 않은 대상을 표시 */
	notIgnore: boolean
	/** 키 값이 있는 대상을 표시 */
	hasLocalizationKey: boolean
	/** 키 값이 없는 대상을 표시 */
	notHasLocalizationKey: boolean
}

/**
 * SearchNodeData 배열을 받아 id를 제외한 나머지 필드가 동일한 항목끼리 그룹화하여
 * PatternMatchData 배열로 변환합니다
 * @param dataArr 검색 노드 데이터 배열
 * @param filterIgnored ignore가 true인 항목을 제외할지 여부
 * @param filterWithLocalizationKey localizationKey가 있는 항목만 포함할지 여부
 * @param includeParentName 키 생성 시 부모 이름을 포함할지 여부
 */
export const groupByPattern = (dataArr: SearchNodeData[], viewOption: ViewOption, groupOption: GroupOption) => {
	const groupMap = new Map<string, PatternMatchData>()

	// 옵션에 따라 필터링
	let filteredData = dataArr
	filteredData = filteredData.filter((item) => {
		// 모든 활성화된 필터 조건을 충족해야 함
		let shouldInclude = true

		// ignore 관련 필터 (각 옵션 내부는 OR 관계)
		let ignoreFilterPassed = true
		if (viewOption.notIgnore || viewOption.ignore) {
			ignoreFilterPassed = (viewOption.notIgnore && !item.ignore) || (viewOption.ignore && item.ignore)
			shouldInclude = shouldInclude && ignoreFilterPassed
		}

		// localizationKey 관련 필터 (각 옵션 내부는 OR 관계)
		let localizationKeyFilterPassed = true
		if (viewOption.hasLocalizationKey || viewOption.notHasLocalizationKey) {
			localizationKeyFilterPassed =
				(viewOption.hasLocalizationKey && item.localizationKey !== '') ||
				(viewOption.notHasLocalizationKey && item.localizationKey === '')
			shouldInclude = shouldInclude && localizationKeyFilterPassed
		}

		// 필터 조건이 활성화되지 않은 경우 기본적으로 모든 항목 포함
		// const isAnyFilterActive =
		// 	viewOption.notIgnore || viewOption.ignore || viewOption.hasLocalizationKey || viewOption.notHasLocalizationKey
		// if (!isAnyFilterActive) {
		// 	return true
		// }

		return shouldInclude
	})

	const filteredDataLength = filteredData.length
	filteredData.forEach((item) => {
		// id를 제외한 필드를 기준으로 고유 키 생성 (옵션에 따라 parentName 포함 여부 결정)
		const keyObj: any = {}

		// 옵션에 따라 부모 이름 포함 여부 결정
		if (groupOption.parentName) {
			keyObj.parentName = item.parentName
		}
		if (groupOption.localizationKey) {
			keyObj.localizationKey = item.localizationKey
		}
		if (groupOption.name) {
			keyObj.name = item.name
		}
		if (groupOption.text) {
			keyObj.text = item.text
		}

		const key = JSON.stringify(keyObj)

		if (!groupMap.has(key)) {
			// 새 그룹 생성
			const newGroup: PatternMatchData = {
				name: item.name,
				ignore: item.ignore,
				localizationKey: item.localizationKey,
				text: item.text,
				parentName: item.parentName,
				ids: [item.id],
			}
			groupMap.set(key, newGroup)
		} else {
			// 기존 그룹에 id 추가
			groupMap.get(key)!.ids.push(item.id)
		}
	})

	// Map 값들을 배열로 변환하여 반환
	return {
		patternMatchData: Array.from(groupMap.values()),
		filteredDataLength,
	}
}

/** 기준 설정이 약간 모호한 부분 */
export const onSetNodeLocalizationKeyBatch = () => {
	on(
		SET_NODE_LOCALIZATION_KEY_BATCH.REQUEST_KEY,
		async (data: { domainId: string; keyId: string; name: string; ids: string[] }) => {
			if (data.ids.length === 0) {
				return
			}
			// originalLocalizeId 조회 또는 등록
			// searchTranslationCode
			const xNode = await figma.getNodeByIdAsync(data.ids[0])

			if (xNode == null || xNode.type !== 'TEXT') {
				return
			}
			setNodeData(xNode, {
				domainId: data.domainId,
				localizationKey: data.keyId,
			})

			const result = await addTranslation(xNode)
			if (result == null) {
				notify('Failed to add translation', 'error')
				return
			}

			for (const id of data.ids) {
				const node = await figma.getNodeByIdAsync(id)
				if (node) {
					setNodeData(node, {
						domainId: data.domainId,
						localizationKey: data.keyId,
						originalLocalizeId: result.localization_id.toString(),
					})
				}
			}

			await reloadOriginalLocalizationName(xNode)
		}
	)
}
