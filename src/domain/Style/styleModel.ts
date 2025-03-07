import { ValidAllStyleRangesType } from '@/figmaPluginUtils/text'

export interface StyleSegment {
	start: number
	end: number
	text: string
	style: Record<string, any>
}

export interface StyleSegmentsResult {
	defaultStyle: Record<string, any>
	segments: StyleSegment[]
}

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
	const points = new Set<number>([0, characters.length])

	// 모든 스타일 속성의 범위를 순회하며 경계점 수집
	Object.values(styleData).forEach((ranges) => {
		if (ranges) {
			ranges.forEach((range) => {
				points.add(range.start)
				points.add(range.end)
			})
		}
	})

	// 2. 정렬된 배열로 변환
	const sortedPoints = Array.from(points).sort((a, b) => a - b)

	// 3. 기본 스타일 결정 (범위가 1개인 스타일 속성)
	const defaultStyle: Record<string, any> = {}

	Object.entries(styleData).forEach(([key, ranges]) => {
		if (ranges && ranges.length === 1 && ranges[0].start === 0 && ranges[0].end === characters.length) {
			defaultStyle[key] = ranges[0].value
		}
	})

	// 4. 각 구간의 스타일 결정 및 세그먼트 생성
	const segments: StyleSegment[] = []

	for (let i = 0; i < sortedPoints.length - 1; i++) {
		const start = sortedPoints[i]
		const end = sortedPoints[i + 1]

		// 현재 구간의 스타일 계산 (기본 스타일 제외)
		const segmentStyle: Record<string, any> = {}

		Object.entries(styleData).forEach(([key, ranges]) => {
			// 기본 스타일에 이미 포함된 속성은 제외
			if (defaultStyle[key] !== undefined) return

			if (ranges) {
				for (const range of ranges) {
					// 범위가 현재 구간을 포함하는지 확인
					if (range.start <= start && range.end >= end) {
						segmentStyle[key] = range.value
						break
					}
				}
			}
		})

		// 구간의 텍스트 가져오기
		const segmentText = characters.substring(start, end)

		// 세그먼트 객체 추가
		segments.push({
			start,
			end,
			text: segmentText,
			style: segmentStyle,
		})
	}

	return {
		defaultStyle,
		segments,
	}
}

export interface StyleGroup {
	style: Record<string, any>
	ranges: { start: number; end: number; text: string }[]
}

const styleClean = (styles: Record<string, any>) => {
	const styleKeys = Object.keys(styles)

	for (const key of styleKeys) {
		const value = styles[key]

		if (value == null) {
			delete styles[key]
		} else if (value === '') {
			delete styles[key]
		} else if (typeof value === 'object' && Object.keys(value).length === 0) {
			delete styles[key]
		}
	}
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
	const { segments, defaultStyle } = segmentsResult

	// 스타일 기준으로 그룹화하기 위한 맵
	const styleMap = new Map<string, StyleGroup>()

	segments.forEach((segment) => {
		// 스타일을 JSON 문자열로 변환하여 키로 사용
		styleClean(segment.style)
		const styleKey = JSON.stringify(segment.style)
		console.log('🚀 ~ segments.forEach ~ styleKey:', styleKey)

		if (!styleMap.has(styleKey)) {
			styleMap.set(styleKey, {
				style: segment.style,
				ranges: [],
			})
		}

		// 해당 스타일 그룹에 현재 세그먼트의 범위 추가
		styleMap.get(styleKey)!.ranges.push({
			start: segment.start,
			end: segment.end,
			text: segment.text,
		})
	})

	// 맵에서 배열로 변환
	const styleGroups = Array.from(styleMap.values())

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

	return { styleGroups, defaultStyle }
}
