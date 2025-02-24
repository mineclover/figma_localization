// 스타일 객체 타입 정의
interface StyleRange<T> {
	start: number
	end: number
	value: T | PluginAPI['mixed']
}

// Range 메서드 시그니처 정의
interface RangeMethods {
	getRangeFontSize(start: number, end: number): StyleRange<number>[]
	getRangeFontName(start: number, end: number): StyleRange<FontName>[]
	getRangeFontWeight(start: number, end: number): StyleRange<number>[]
	getRangeLineHeight(start: number, end: number): StyleRange<LineHeight>[]
	getRangeLetterSpacing(start: number, end: number): StyleRange<LetterSpacing>[]
	getRangeTextDecoration(start: number, end: number): StyleRange<TextDecoration>[]
	getRangeTextCase(start: number, end: number): StyleRange<TextCase>[]
	getRangeTextStyleId(start: number, end: number): StyleRange<string>[]
}
function getStyleRanges<T>(textNode: TextNode, getRangeMethod: (start: number, end: number) => any) {
	const length = textNode.characters.length

	let start = 0
	const ranges: StyleRange<T>[] = []

	while (start < length) {
		const initialStyle = getRangeMethod.call(textNode, start, start + 1)
		let end = start + 1

		// 순차 탐색으로 변경
		while (end <= length) {
			const currentStyle = getRangeMethod.call(textNode, start, end)

			// 스타일이 변경되거나 mixed이면 이전 위치까지를 하나의 범위로 저장
			if (currentStyle === figma.mixed || currentStyle !== initialStyle) {
				// 마지막 구간이 처리 안되서 -1을 밖에서 처리 함
				break
			}
			end++
		}

		// 범위 정보 저장
		ranges.push({
			start,
			end: end - 1, // end는 변경지점이므로 -1
			value: initialStyle,
		})

		// 다음 범위의 시작점으로 이동
		start = end - 1
	}

	return ranges
}

// 스타일별 Range 처리 함수들
function getFontSizeRanges(textNode: TextNode): StyleRange<number>[] | null {
	if (textNode.fontSize === figma.mixed) {
		return getStyleRanges<number>(textNode, textNode.getRangeFontSize)
	}
	return [
		{
			start: 0,
			end: textNode.characters.length,
			value: textNode.fontSize,
		},
	]
}

function getFontNameRanges(textNode: TextNode): StyleRange<FontName>[] | null {
	if (textNode.fontName === figma.mixed) {
		return getStyleRanges<FontName>(textNode, textNode.getRangeFontName)
	}
	return [
		{
			start: 0,
			end: textNode.characters.length,
			value: textNode.fontName,
		},
	]
}

function getLineHeightRanges(textNode: TextNode): StyleRange<LineHeight>[] | null {
	if (textNode.lineHeight === figma.mixed) {
		return getStyleRanges<LineHeight>(textNode, textNode.getRangeLineHeight)
	}
	return [
		{
			start: 0,
			end: textNode.characters.length,
			value: textNode.lineHeight,
		},
	]
}

function getLetterSpacingRanges(textNode: TextNode): StyleRange<LetterSpacing>[] | null {
	if (textNode.letterSpacing === figma.mixed) {
		return getStyleRanges<LetterSpacing>(textNode, textNode.getRangeLetterSpacing)
	}
	return [
		{
			start: 0,
			end: textNode.characters.length,
			value: textNode.letterSpacing,
		},
	]
}

function getTextDecorationRanges(textNode: TextNode): StyleRange<TextDecoration>[] | null {
	if (textNode.textDecoration === figma.mixed) {
		return getStyleRanges<TextDecoration>(textNode, textNode.getRangeTextDecoration)
	}
	return [
		{
			start: 0,
			end: textNode.characters.length,
			value: textNode.textDecoration,
		},
	]
}

function getTextCaseRanges(textNode: TextNode): StyleRange<TextCase>[] | null {
	if (textNode.textCase === figma.mixed) {
		return getStyleRanges<TextCase>(textNode, textNode.getRangeTextCase)
	}
	return [
		{
			start: 0,
			end: textNode.characters.length,
			value: textNode.textCase,
		},
	]
}

function getTextStyleIdRanges(textNode: TextNode): StyleRange<string>[] | null {
	if (textNode.textStyleId === figma.mixed) {
		return getStyleRanges<string>(textNode, textNode.getRangeTextStyleId)
	}
	return [
		{
			start: 0,
			end: textNode.characters.length,
			value: textNode.textStyleId,
		},
	]
}

// 모든 스타일 Range를 가져오는 함수
interface AllStyleRanges {
	fontSize: StyleRange<number>[] | null
	fontName: StyleRange<FontName>[] | null
	lineHeight: StyleRange<LineHeight>[] | null
	letterSpacing: StyleRange<LetterSpacing>[] | null
	textDecoration: StyleRange<TextDecoration>[] | null
	textCase: StyleRange<TextCase>[] | null
	textStyleId: StyleRange<string>[] | null
}

export function getAllStyleRanges(textNode: TextNode): AllStyleRanges {
	return {
		fontSize: getFontSizeRanges(textNode),
		fontName: getFontNameRanges(textNode),
		lineHeight: getLineHeightRanges(textNode),
		letterSpacing: getLetterSpacingRanges(textNode),
		textDecoration: getTextDecorationRanges(textNode),
		textCase: getTextCaseRanges(textNode),
		textStyleId: getTextStyleIdRanges(textNode),
	}
}
