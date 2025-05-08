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

import { emit, on } from '@create-figma-plugin/utilities';
import {
	GET_PATTERN_MATCH_KEY,
	NODE_STORE_KEY,
	SET_NODE_IGNORE,
	SET_NODE_LOCALIZATION_KEY_BATCH,
	UPDATE_NODE_LOCALIZATION_KEY_BATCH,
} from '../constant';
import {
	addTranslation,
	allRefresh,
	processTextNodeLocalization,
	reloadOriginalLocalizationName,
	setNodeData,
} from '../Label/TextPluginDataModel';
import { notify } from '@/figmaPluginUtils';
import { patternMatchDataSignal } from '@/model/signal';
import { SearchNodeData, PatternMatchData, GroupOption, ViewOption, LocationDTO } from '@/model/types';
import { MetaData, searchStore } from '../Search/searchStore';
import { getDirectLink } from '../getState';

export const onPatternMatch = () => {
	on(GET_PATTERN_MATCH_KEY.REQUEST_KEY, async (targetID?: string) => {
		// 일단 선택된 섹션 관리
		figma.skipInvisibleInstanceChildren = true;
		const ignoreSections = figma.currentPage.children
			.filter((item) => item.type === 'SECTION')
			.filter((item) => item.id === targetID);
		const { metadata } = await searchStore.search(ignoreSections.map((item) => item.id));
	});
};

export const onPatternMatchResponse = () => {
	emit(GET_PATTERN_MATCH_KEY.REQUEST_KEY);
	return on(GET_PATTERN_MATCH_KEY.RESPONSE_KEY, (dataArr: MetaData[]) => {
		patternMatchDataSignal.value = dataArr;
	});
};

/**
 * SearchNodeData 배열을 받아 id를 제외한 나머지 필드가 동일한 항목끼리 그룹화하여
 * PatternMatchData 배열로 변환합니다
 * @param dataArr 검색 노드 데이터 배열
 * @param filterIgnored ignore가 true인 항목을 제외할지 여부
 * @param filterWithLocalizationKey localizationKey가 있는 항목만 포함할지 여부
 * @param includeParentName 키 생성 시 부모 이름을 포함할지 여부
 */
export const groupByPattern = (dataArr: SearchNodeData[], viewOption: ViewOption, groupOption: GroupOption) => {
	const groupMap = new Map<string, PatternMatchData>();

	// 옵션에 따라 필터링
	let filteredData = dataArr;
	filteredData = filteredData.filter((item) => {
		// 모든 활성화된 필터 조건을 충족해야 함
		let shouldInclude = true;

		// ignore 관련 필터 (각 옵션 내부는 OR 관계)
		let ignoreFilterPassed = true;
		if (viewOption.notIgnore || viewOption.ignore) {
			ignoreFilterPassed = (viewOption.notIgnore && !item.ignore) || (viewOption.ignore && item.ignore);
			shouldInclude = shouldInclude && ignoreFilterPassed;
		}

		// localizationKey 관련 필터 (각 옵션 내부는 OR 관계)
		let localizationKeyFilterPassed = true;
		if (viewOption.hasLocalizationKey || viewOption.notHasLocalizationKey) {
			localizationKeyFilterPassed =
				(viewOption.hasLocalizationKey && item.localizationKey !== '') ||
				(viewOption.notHasLocalizationKey && item.localizationKey === '');
			shouldInclude = shouldInclude && localizationKeyFilterPassed;
		}

		// 필터 조건이 활성화되지 않은 경우 기본적으로 모든 항목 포함
		// const isAnyFilterActive =
		// 	viewOption.notIgnore || viewOption.ignore || viewOption.hasLocalizationKey || viewOption.notHasLocalizationKey
		// if (!isAnyFilterActive) {
		// 	return true
		// }

		return shouldInclude;
	});

	const filteredDataLength = filteredData.length;
	filteredData.forEach((item) => {
		// id를 제외한 필드를 기준으로 고유 키 생성 (옵션에 따라 parentName 포함 여부 결정)
		const keyObj: any = {};

		// 옵션에 따라 부모 이름 포함 여부 결정
		if (groupOption.parentName) {
			keyObj.parentName = item.parentName;
		}
		if (groupOption.localizationKey) {
			keyObj.localizationKey = item.localizationKey;
		}
		if (groupOption.name) {
			keyObj.name = item.name;
		}
		if (groupOption.text) {
			keyObj.text = item.text;
		}

		const key = JSON.stringify(keyObj);

		if (!groupMap.has(key)) {
			// 새 그룹 생성
			const newGroup: PatternMatchData = {
				name: item.name,
				ignore: item.ignore,
				localizationKey: item.localizationKey,
				text: item.text,
				parentName: item.parentName,
				ids: [item.id],
			};
			groupMap.set(key, newGroup);
		} else {
			// 기존 그룹에 id 추가
			groupMap.get(key)!.ids.push(item.id);
		}
	});

	// Map 값들을 배열로 변환하여 반환
	return {
		patternMatchData: Array.from(groupMap.values()),
		filteredDataLength,
	};
};

export const idsBaseAll = async (
	data: { domainId: string; keyId: string; ids: string[] },
	baseNodeData?: LocationDTO
) => {
	if (data.ids.length === 0) {
		return;
	}
	if (baseNodeData == null) {
		return;
	}

	const directLink = getDirectLink(baseNodeData);
	console.log('🚀 ~ directLink:', directLink);

	const baseNodeId = baseNodeData.node_id;
	const baseLocation = baseNodeData.location_id;
	// originalLocalizeId 조회 또는 등록
	// searchTranslationCode

	const xNode = baseNodeId ? await figma.getNodeByIdAsync(baseNodeId) : null;

	// 기준 노드 중심으로 설정
	if (xNode) {
		setNodeData(xNode, {
			domainId: data.domainId,
			localizationKey: data.keyId,
			baseNodeId: String(baseLocation),
		});
	}

	// 기준 나머지 노드도 설정
	for (const id of data.ids) {
		const node = await figma.getNodeByIdAsync(id);
		if (node) {
			setNodeData(node, {
				domainId: data.domainId,
				localizationKey: data.keyId,
				baseNodeId: String(baseLocation),
			});
		}
	}
};

/**
 * 기준 설정이 약간 모호한 부분
 * 기준 키로 모든 스타일이 변경되고 오리진도 등록됨 (addTranslation)
 *
 */
export const baseIsAllNode = async (data: { domainId: string; keyId: string; ids: string[] }, baseNodeId?: string) => {
	if (data.ids.length === 0) {
		return;
	}
	// originalLocalizeId 조회 또는 등록
	// searchTranslationCode
	const xNode = baseNodeId ? await figma.getNodeByIdAsync(baseNodeId) : null;

	// 기준 노드가 있으면 기준 노드 설정
	if (xNode) {
		setNodeData(xNode, {
			domainId: data.domainId,
			localizationKey: data.keyId,
			baseNodeId: baseNodeId,
		});
		if (xNode == null || xNode.type !== 'TEXT') {
			return;
		}
		const result = await addTranslation(xNode);
		if (result == null || result.localization_id == null) {
			// 설정 실패 처리
			notify('Failed to add translation', 'error');
			return;
		}
	}

	// 기준 노드가 없으면 모든 노드 설정
	for (const id of data.ids) {
		const node = await figma.getNodeByIdAsync(id);
		if (node) {
			setNodeData(node, {
				domainId: data.domainId,
				localizationKey: data.keyId,
				baseNodeId: baseNodeId,
			});
		}
	}
	if (xNode) {
		// 기준 노드가 있으면 기준 노드 설정 전파
		await reloadOriginalLocalizationName(xNode);
	}
};

export const onSetNodeLocalizationKeyBatch = () => {
	// 하나의 로컬라이제이션 키를 대표해서 등록하는 코드
	on(
		SET_NODE_LOCALIZATION_KEY_BATCH.REQUEST_KEY,
		async (data: { domainId: string; keyId: string; ids: string[] }, baseNodeId?: string) => {
			await baseIsAllNode(data, baseNodeId);
		}
	);
};

export const onUpdateNodeLocalizationKeyBatch = () => {
	on(
		UPDATE_NODE_LOCALIZATION_KEY_BATCH.REQUEST_KEY,
		async (data: { domainId?: string; keyId: string; originId?: string; ids: string[] }) => {
			if (data.ids.length === 0) {
				return;
			}

			// originalLocalizeId 조회
			// const originTextResult = await getLocalizationKeyData(data.keyId, date);

			for (const id of data.ids) {
				const node = await figma.getNodeByIdAsync(id);
				if (node) {
					setNodeData(node, {
						domainId: data.domainId,
						localizationKey: data.keyId,
					});
				}
			}

			const node = await figma.getNodeByIdAsync(data.ids[0]);
			if (node) {
				await reloadOriginalLocalizationName(node);
			}
		}
	);
};

export const onSetNodeIgnore = () => {
	on(SET_NODE_IGNORE.REQUEST_KEY, async (data: { ignore: boolean; ids: string[] }) => {
		if (data.ids.length === 0) {
			return;
		}
		// originalLocalizeId 조회

		for (const id of data.ids) {
			const node = await figma.getNodeByIdAsync(id);
			if (node) {
				setNodeData(node, {
					ignore: data.ignore,
				});
			}
		}
		const node = await figma.getNodeByIdAsync(data.ids[0]);
		if (node) {
			await reloadOriginalLocalizationName(node);
		}
	});
};
