import { ValidAllStyleRangesType } from '@/figmaPluginUtils/text';
import { createStableStyleKey, sha256Hash } from '@/utils/keyJson';
import {
	LocalizationTranslationDTO,
	ParsedResourceDTO,
	ResourceDTO,
	StyleGroup,
	StyleSegment,
	StyleSegmentsResult,
	StyleSync,
} from '@/model/types';
import { DOWNLOAD_STYLE, NODE_STORE_KEY, SET_STYLE, UPDATE_STYLE_DATA } from '../constant';
import { on } from '@create-figma-plugin/utilities';
import { notify } from '@/figmaPluginUtils';
import {
	setNodeData,
	addTranslation,
	reloadOriginalLocalizationName,
	getLocalizationKeyData,
	generateLocalizationName,
} from '../Label/TextPluginDataModel';
import { getNodeData } from '../getState';
import { getDomainSetting } from '../Setting/SettingModel';
import { fetchDB } from '../utils/fetchDB';
import { parseTextBlock, parseXML } from '@/utils/xml';
import { TargetNodeStyleUpdate } from './styleAction';
import { downloadStatus } from '@/model/on/onChanges';

const range = (start: number, end: number) => {
	return Array.from({ length: end - start }, (_, i) => start + i);
};

/**
 * 텍스트 문자열과 스타일 데이터를 받아 스타일 세그먼트를 생성합니다.
 * defaultStyle 도 여기서 출력함
 * 스타일 키 : range value
 * @param characters 텍스트 문자열
 * @param styleData 스타일 데이터
 * @returns 스타일 세그먼트 결과
 */
export const createStyleSegments = (characters: string, styleData: ValidAllStyleRangesType): StyleSegmentsResult => {
	// 1. 모든 범위의 시작점과 끝점 수집
	const points = new Set<number>([0, characters.length]);

	// 모든 스타일 속성의 범위를 순회하며 경계점 수집
	Object.values(styleData).forEach((ranges) => {
		if (ranges) {
			ranges.forEach((range) => {
				points.add(range.start);
				points.add(range.end);
			});
		}
	});

	// 2. 정렬된 배열로 변환
	const sortedPoints = Array.from(points).sort((a, b) => a - b);

	// 3. 기본 스타일 결정 (범위가 1개인 스타일 속성)
	const defaultStyle: Record<string, any> = {};

	Object.entries(styleData).forEach(([key, ranges]) => {
		if (ranges && ranges.length === 1 && ranges[0].start === 0 && ranges[0].end === characters.length) {
			defaultStyle[key] = ranges[0].value;
		}
	});

	// 4. 각 구간의 스타일 결정 및 세그먼트 생성
	const segments: StyleSegment[] = [];

	for (let i = 0; i < sortedPoints.length - 1; i++) {
		const start = sortedPoints[i];
		const end = sortedPoints[i + 1];

		// 현재 구간의 스타일 계산 (기본 스타일 제외)
		const segmentStyle: Record<string, any> = {};

		Object.entries(styleData).forEach(([key, ranges]) => {
			// 기본 스타일에 이미 포함된 속성은 제외
			if (defaultStyle[key] !== undefined) return;

			if (ranges) {
				for (const range of ranges) {
					// 범위가 현재 구간을 포함하는지 확인
					if (range.start <= start && range.end >= end) {
						segmentStyle[key] = range.value;
						break;
					}
				}
			}
		});

		// 구간의 텍스트 가져오기
		const segmentText = characters.substring(start, end);

		// 세그먼트 객체 추가
		segments.push({
			start,
			end,
			text: segmentText,
			style: segmentStyle,
		});
	}

	return {
		defaultStyle,
		segments,
	};
};

const styleClean = (styles: Record<string, any>) => {
	const styleKeys = Object.keys(styles);

	for (const key of styleKeys) {
		const value = styles[key];

		if (value == null) {
			delete styles[key];
		} else if (value === '') {
			delete styles[key];
		} else if (typeof value === 'object' && Object.keys(value).length === 0) {
			delete styles[key];
		}
	}

	return styles;
};

/**
 * Converts an array of positions into ranges of consecutive numbers
 * and returns objects with start, end, and corresponding text segments
 *
 * @param {number[]} positions - Array of position indices
 * @param {string} text - Text to be split according to positions
 * @returns {Array<{start: number, end: number, text: string}>} Array of range objects with text
 */
function processPositionsAndText(positions: number[], text: string) {
	// Step 1: Sort positions to ensure proper order
	positions.sort((a, b) => a - b);

	// Step 2: Group positions into consecutive ranges
	const ranges = [];
	let rangeStart = positions[0];
	let prev = positions[0];

	// Find ranges of consecutive positions
	for (let i = 1; i < positions.length; i++) {
		if (positions[i] !== prev + 1) {
			// Gap found, end the current range and start a new one
			ranges.push({ start: rangeStart, end: prev });
			rangeStart = positions[i];
		}
		prev = positions[i];
	}

	// Add the last range
	ranges.push({ start: rangeStart, end: prev });

	// Step 3: Process each range to get corresponding text segment
	const result = [];

	for (const range of ranges) {
		// Calculate start and end indices for text slicing
		// This assumes positions correspond to characters in the text
		const textStart = range.start;
		const textEnd = range.end + 1; // +1 because end is inclusive in range but exclusive in slice

		// Get text segment for this range
		const textSegment = text.substring(textStart, textEnd);

		// Add to result
		result.push({
			start: range.start,
			end: textEnd,
			text: textSegment,
		});
	}

	return result;
}

/**
 * 스타일과 Ranges 를 분리해서 정리함
 * 이전 세그멘테이션은 중복 스타일이여도 허용했다면 스타일 집군으로 range를 모아서 중복 스타일을 제거함
 * @param segmentsResult
 * @returns
 */
export const groupSegmentsByStyle = (
	segmentsResult: StyleSegmentsResult
): { styleGroups: StyleGroup[]; defaultStyle: Record<string, any> } => {
	const { segments, defaultStyle } = segmentsResult;

	// 스타일 기준으로 그룹화하기 위한 맵
	const styleMap = new Map<string, StyleGroup>();

	segments.forEach((segment) => {
		// 스타일을 JSON 문자열로 변환하여 키로 사용
		styleClean(segment.style);
		const styleKey = createStableStyleKey(segment.style);

		if (!styleMap.has(styleKey)) {
			styleMap.set(styleKey, {
				style: segment.style,
				ranges: [],
			});
		}

		// 해당 스타일 그룹에 현재 세그먼트의 범위 추가
		styleMap.get(styleKey)!.ranges.push({
			start: segment.start,
			end: segment.end,
			text: segment.text,
		});
	});

	// 맵에서 배열로 변환
	const styleGroups = Array.from(styleMap.values());

	// // 기본 스타일이 있는 경우 별도 그룹으로 추가
	// if (Object.keys(defaultStyle).length > 0) {
	// 	// 전체 텍스트에 적용된 기본 스타일은 맨 앞에 배치
	// 	styleGroups.unshift({
	// 		style: defaultStyle,
	// 		ranges: [
	// 			{
	// 				start: 0,
	// 				end: segments.length > 0 ? segments[segments.length - 1].end : 0,
	// 				text: segments.map((s) => s.text).join(''),
	// 			},
	// 		],
	// 	})
	// }

	return { styleGroups, defaultStyle };
};

export interface StylePosition {
	style: Record<string, any>;
	position: number[];
}

// 생성 비용이 높은데 매번 처리하는 것에 대해 좀 더 최적화 필요
export const createStyleHashId = (style: Record<string, any>) => {
	const jsonString = createStableStyleKey(style);
	const hashId = sha256Hash(jsonString);

	return hashId;
};

/**
 * 스타일과 Ranges 를 분리해서 정리함
 * 이전 세그멘테이션은 중복 스타일이여도 허용했다면 스타일 집군으로 range를 모아서 중복 스타일을 제거함
 * @param segmentsResult
 * @returns
 */
export const groupAllSegmentsByStyle = (
	characters: string,
	segmentsResult: StyleSegmentsResult,
	boundVariablesResult: StyleSegmentsResult
): { styleGroups: StyleGroup[]; defaultStyle: Record<string, any>; exportStyleGroups: StyleSync[] } => {
	const { segments, defaultStyle } = segmentsResult;
	const { segments: boundVariablesSegments, defaultStyle: boundVariablesDefaultStyle } = boundVariablesResult;

	const allDefaultStyle = { ...defaultStyle, boundVariables: styleClean(boundVariablesDefaultStyle) };

	// 공간 매핑
	const positionMap = new Map<number, Record<string, any>>();

	segments.forEach((segment) => {
		const { start, end, style } = segment;

		for (let i = start; i < end; i++) {
			styleClean(style);
			positionMap.set(i, style);
		}
	});

	boundVariablesSegments.forEach((segment) => {
		const { start, end, style } = segment;
		styleClean(style);
		for (let i = start; i < end; i++) {
			const currentStyle = positionMap.get(i);

			if (currentStyle) {
				positionMap.set(i, { ...currentStyle, boundVariables: style });
			} else {
				positionMap.set(i, { boundVariables: style });
			}
			// 바인드 변수는 기본 스타일이 없으면 생략.. 하는 로직은 제거
			// if (Object.keys(style).length !== 0) {

			// }
		}
	});

	// 스타일 기준으로 그룹화하기 위한 맵
	const styleMap = new Map<string, StylePosition>();

	for (const pointer of range(0, positionMap.size)) {
		const style = positionMap.get(pointer);

		if (style) {
			const styleKey = createStableStyleKey(style);
			if (!styleMap.has(styleKey)) {
				styleMap.set(styleKey, {
					style: style,
					position: [],
				});
			}
			styleMap.get(styleKey)!.position.push(pointer);
		}
	}

	// 맵에서 배열로 변환
	const styleGroups = Array.from(styleMap.values());

	const result = styleGroups.map((group) => {
		return {
			style: group.style,
			ranges: processPositionsAndText(group.position, characters),
		};
	});

	const exportStyleGroups = styleGroups.map((group) => {
		const allStyle = {
			...allDefaultStyle,
			...group.style,
			boundVariables: { ...allDefaultStyle.boundVariables, ...group.style.boundVariables },
		};

		const hashId = createStyleHashId(allStyle);

		return {
			style: allStyle,
			ranges: processPositionsAndText(group.position, characters),
			hashId,
		};
	});

	return { styleGroups: result, defaultStyle: allDefaultStyle, exportStyleGroups };
};

/**
 * 일단 로컬라이제이션 키가 있다는 것을 전재로 함
 * 받아온 키를 통해
 * 해당 아이디의 스타일을 선택 노드에 적용하는 코드임
 */
export const onDownloadStyle = () => {
	// on(DOWNLOAD_STYLE.REQUEST_KEY, async () => {
	on(DOWNLOAD_STYLE.REQUEST_KEY, async ({ localizationKey, lang }: { localizationKey: string; lang: string }) => {
		downloadStatus.downloading = true;
		const xNode = figma.currentPage.selection[0];
		const domainSetting = getDomainSetting();

		if (domainSetting == null) {
			notify('Failed to get domain id', 'error');
			downloadStatus.downloading = false;
			return;
		}

		if (xNode == null) {
			notify('Failed to get node', 'error');
			downloadStatus.downloading = false;
			return;
		}
		// originalLocalizeId 조회 또는 등록
		// searchTranslationCode
		if (xNode.type !== 'TEXT') {
			notify('Failed to get node', 'error');
			downloadStatus.downloading = false;
			return;
		}
		// 디자인된 버전의 텍스트로 변경
		await TargetNodeStyleUpdate(xNode, localizationKey, lang, Date.now());
		downloadStatus.downloading = false;
	});
};

// 이거 자체가 불필요 하다
export const onSetStyle = () => {
	// 세이브 대상이 이해되야 함
	// 현재 상태로 스타일을 저장해라 임
	// 스타일 데이터는 현재 노드에 저장되어 있음
	// 결국 저장될 대상은 label xml 임
	// 저장한다는 건, 스타일 결정에 필요한 로컬라이제이션 키와 액션 값을 노드에 넣는 것임
	// 도메인 키를 받아서 쓸 수 있지만 확장성을 고려할 땐 데이터를 선형적으로 관리하는게 좋음
	// 여기서 선형적이라 함은, 데이터 흐름의 일원화를 말함..
	//
	on(
		SET_STYLE.REQUEST_KEY,
		async ({
			key,
			action,

			modifier,
		}: {
			// domain: string;
			key: string;
			action: string;

			/** 어떻게 수집할 것인지 결정되지 않음 */
			modifier?: string;
		}) => {
			const xNode = figma.currentPage.selection[0];

			const domainSetting = getDomainSetting();

			if (domainSetting == null) {
				notify('Failed to get domain id', 'error');
				return;
			}

			if (xNode == null) {
				notify('Failed to get node', 'error');
				return;
			}
			// originalLocalizeId 조회 또는 등록
			// searchTranslationCode
			if (xNode.type !== 'TEXT') {
				notify('Failed to get node', 'error');
				return;
			}
			// setNodeData(xNode, {
			// 	domainId: domainSetting.domainId.toString(),
			// })

			// 업로드는 업데이트 안해도 되지 않나 해서 뺌
			// 한 개 업데이트
			// await TargetNodeStyleUpdate(xNode, result.key_id.toString(), 'origin', Date.now());
			// 같은 키 업데이트
			// await reloadOriginalLocalizationName(xNode);
		}
	);
};
