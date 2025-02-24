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
	// getRangeAllFontNames(start: number, end: number): StyleRange<FontName>[]
	getRangeOpenTypeFeatures(start: number, end: number): StyleRange<{ [feature in OpenTypeFeature]: boolean }>[]
	getRangeHyperlink(start: number, end: number): StyleRange<HyperlinkTarget | null>[]
	getRangeFills(start: number, end: number): StyleRange<Paint[]>[]
	getRangeFillStyleId(start: number, end: number): StyleRange<string>[]
	getRangeListOptions(start: number, end: number): StyleRange<TextListOptions>[]
	getRangeIndentation(start: number, end: number): StyleRange<number>[]
}
function getStyleRanges<T>(textNode: TextNode, getRangeMethod: (start: number, end: number) => any) {
	const length = textNode.characters.length

	let start = 0
	let end = 1
	const ranges: StyleRange<T>[] = []

	while (start < length) {
		const initialStyle = getRangeMethod.call(textNode, start, end)

		// 순차 탐색으로 변경
		while (end <= length) {
			// console.log('🚀 ~ 탐색:', start, end)
			const currentStyle = getRangeMethod.call(textNode, start, end)

			// 스타일이 변경되거나 mixed이면 이전 위치까지를 하나의 범위로 저장
			if (currentStyle === figma.mixed) {
				// console.log('🚀 ~ 종료  :', start, end, currentStyle)
				end = end - 1
				break
			}
			if (end === length) {
				end = length
				break
			}
			end++
		}

		// 범위 정보 저장
		ranges.push({
			start,
			end: end, // end는 변경지점이므로 -1
			value: initialStyle,
		})

		// 다음 범위의 시작점으로 이동 (수정된 부분)
		start = end // end - 1 대신 end를 사용
		end = start + 1
	}

	return ranges
}

// 스타일별 Range 처리 함수들
function getFontSizeRanges(textNode: TextNode): StyleRange<number>[] | null {
	if (textNode.fontSize === figma.mixed) {
		return getStyleRanges<number>(textNode, textNode.getRangeFontSize)
	}
	if (textNode.fontSize == null) {
		return null
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
	if (textNode.fontName == null) {
		return null
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
	if (textNode.lineHeight == null) {
		return null
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
	if (textNode.letterSpacing == null || textNode.letterSpacing.value === 0) {
		return null
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
	if (textNode.textDecoration == null || textNode.textDecoration === 'NONE') {
		return null
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
	if (textNode.textCase == null || textNode.textCase === 'ORIGINAL') {
		return null
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
	if (textNode.textStyleId == null || textNode.textStyleId === '') {
		return null
	}
	return [
		{
			start: 0,
			end: textNode.characters.length,
			value: textNode.textStyleId,
		},
	]
}

function getFontWeightRanges(textNode: TextNode): StyleRange<number>[] | null {
	if (textNode.fontWeight === figma.mixed) {
		return getStyleRanges<number>(textNode, textNode.getRangeFontWeight)
	}
	if (textNode.fontWeight == null) {
		return null
	}
	return [
		{
			start: 0,
			end: textNode.characters.length,
			value: textNode.fontWeight,
		},
	]
}

/** 제대로 동작하지 않음 */
// function getAllFontNamesRanges(textNode: TextNode): StyleRange<FontName>[] | null {
// 	if (textNode.fontName === figma.mixed) {
// 		return getStyleRanges<FontName>(textNode, textNode.getRangeAllFontNames)
// 	}
// 	if (textNode.fontName == null) {
// 		return null
// 	}
// 	return [
// 		{
// 			start: 0,
// 			end: textNode.characters.length,
// 			value: textNode.fontName,
// 		},
// 	]
// }

function getOpenTypeFeaturesRanges(textNode: TextNode): StyleRange<{ [feature in OpenTypeFeature]: boolean }>[] | null {
	if (textNode.openTypeFeatures === figma.mixed) {
		return getStyleRanges<{ [feature in OpenTypeFeature]: boolean }>(textNode, textNode.getRangeOpenTypeFeatures)
	}
	if (textNode.openTypeFeatures == null || Object.keys(textNode.openTypeFeatures).length === 0) {
		return null
	}
	return [
		{
			start: 0,
			end: textNode.characters.length,
			value: textNode.openTypeFeatures,
		},
	]
}

function getHyperlinkRanges(textNode: TextNode): StyleRange<HyperlinkTarget | null>[] | null {
	if (textNode.hyperlink === figma.mixed) {
		return getStyleRanges<HyperlinkTarget | null>(textNode, textNode.getRangeHyperlink)
	}
	if (textNode.hyperlink == null || textNode.hyperlink.value === '') {
		return null
	}
	return [
		{
			start: 0,
			end: textNode.characters.length,
			value: textNode.hyperlink,
		},
	]
}

function getFillsRanges(textNode: TextNode): StyleRange<Paint[]>[] | null {
	if (textNode.fills === figma.mixed) {
		return getStyleRanges<Paint[]>(textNode, textNode.getRangeFills)
	}
	if (textNode.fills == null || textNode.fills.length === 0) {
		return null
	}
	return [
		{
			start: 0,
			end: textNode.characters.length,
			value: textNode.fills as Paint[],
		},
	]
}

function getFillStyleIdRanges(textNode: TextNode): StyleRange<string>[] | null {
	if (textNode.fillStyleId === figma.mixed) {
		return getStyleRanges<string>(textNode, textNode.getRangeFillStyleId)
	}
	if (textNode.fillStyleId == null || textNode.fillStyleId === '') {
		return null
	}
	return [
		{
			start: 0,
			end: textNode.characters.length,
			value: textNode.fillStyleId,
		},
	]
}

// 모든 스타일 Range를 가져오는 함수
interface AllStyleRanges {
	fontSize?: StyleRange<number>[] | null
	fontName?: StyleRange<FontName>[] | null
	lineHeight?: StyleRange<LineHeight>[] | null
	letterSpacing?: StyleRange<LetterSpacing>[] | null
	textDecoration?: StyleRange<TextDecoration>[] | null
	textCase?: StyleRange<TextCase>[] | null
	textStyleId?: StyleRange<string>[] | null
	fontWeight?: StyleRange<number>[] | null
	fontNames?: StyleRange<FontName>[] | null
	openTypeFeatures?: StyleRange<{ [feature in OpenTypeFeature]: boolean }>[] | null
	hyperlink?: StyleRange<HyperlinkTarget | null>[] | null
	fills?: StyleRange<Paint[]>[] | null
	fillStyleId?: StyleRange<string>[] | null
	// listOptions: StyleRange<TextListOptions>[] | null
	// indentation: StyleRange<number>[] | null
}

// 외부 DB 써써 데이터 저장한 다음 고유키 발급 받기?

export function getAllStyleRanges(textNode: TextNode): AllStyleRanges {
	const temp: AllStyleRanges = {
		fontSize: getFontSizeRanges(textNode),
		fontName: getFontNameRanges(textNode),
		// fontNames: getAllFontNamesRanges(textNode),
		lineHeight: getLineHeightRanges(textNode),
		letterSpacing: getLetterSpacingRanges(textNode),
		textDecoration: getTextDecorationRanges(textNode),
		textCase: getTextCaseRanges(textNode),
		textStyleId: getTextStyleIdRanges(textNode),
		fontWeight: getFontWeightRanges(textNode),
		openTypeFeatures: getOpenTypeFeaturesRanges(textNode),
		hyperlink: getHyperlinkRanges(textNode),
		fills: getFillsRanges(textNode),
		fillStyleId: getFillStyleIdRanges(textNode),
	} as const

	for (const key in temp) {
		if (temp[key as keyof AllStyleRanges] == null) {
			delete temp[key as keyof AllStyleRanges]
		}
	}

	return temp
}
