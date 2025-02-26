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
