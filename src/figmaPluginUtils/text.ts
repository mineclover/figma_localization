import { ResourceDTO } from '@/model/types';

// 스타일 객체 타입 정의
interface StyleRange<T> {
	start: number;
	end: number;
	value: T | PluginAPI['mixed'];
}

// Range 메서드 시그니처 정의
interface RangeMethods {
	getRangeFontSize(start: number, end: number): StyleRange<number>[];
	getRangeFontName(start: number, end: number): StyleRange<FontName>[];
	getRangeFontWeight(start: number, end: number): StyleRange<number>[];
	getRangeLineHeight(start: number, end: number): StyleRange<LineHeight>[];
	getRangeLetterSpacing(start: number, end: number): StyleRange<LetterSpacing>[];
	getRangeTextDecoration(start: number, end: number): StyleRange<TextDecoration>[];
	getRangeTextCase(start: number, end: number): StyleRange<TextCase>[];
	// getRangeAllFontNames(start: number, end: number): StyleRange<FontName>[]
	getRangeOpenTypeFeatures(start: number, end: number): StyleRange<{ [feature in OpenTypeFeature]: boolean }>[];
	getRangeHyperlink(start: number, end: number): StyleRange<HyperlinkTarget | null>[];
	getRangeTextStyleId(start: number, end: number): StyleRange<string>[];
	getRangeFills(start: number, end: number): StyleRange<Paint[]>[];
	getRangeFillStyleId(start: number, end: number): StyleRange<string>[];
	getRangeListOptions(start: number, end: number): StyleRange<TextListOptions>[];
	getRangeIndentation(start: number, end: number): StyleRange<number>[];
}
function getStyleRanges<T>(textNode: TextNode, getRangeMethod: (start: number, end: number) => any) {
	const length = textNode.characters.length;

	let start = 0;
	let end = 1;
	const ranges: StyleRange<T>[] = [];

	while (start < length) {
		const initialStyle = getRangeMethod.call(textNode, start, end);

		// 순차 탐색으로 변경
		while (end <= length) {
			const currentStyle = getRangeMethod.call(textNode, start, end);

			// 스타일이 변경되거나 mixed이면 이전 위치까지를 하나의 범위로 저장
			if (currentStyle === figma.mixed) {
				end = end - 1;
				break;
			}
			if (end === length) {
				end = length;
				break;
			}
			end++;
		}

		// 범위 정보 저장
		ranges.push({
			start,
			end: end, // end는 변경지점이므로 -1
			value: initialStyle,
		});

		// 다음 범위의 시작점으로 이동 (수정된 부분)
		start = end; // end - 1 대신 end를 사용
		end = start + 1;
	}

	return ranges;
}

function getBoundVariableStyleRanges<T>(
	textNode: TextNode,
	field: VariableBindableTextField,
	getRangeMethod: (start: number, end: number, field: VariableBindableTextField) => any
) {
	const length = textNode.characters.length;

	let start = 0;
	let end = 1;
	const ranges: StyleRange<T>[] = [];

	while (start < length) {
		const initialStyle = getRangeMethod.call(textNode, start, end, field);

		// 순차 탐색으로 변경
		while (end <= length) {
			const currentStyle = getRangeMethod.call(textNode, start, end, field);

			// 스타일이 변경되거나 mixed이면 이전 위치까지를 하나의 범위로 저장
			if (currentStyle == figma.mixed) {
				end = end - 1;
				break;
			}
			if (end === length) {
				end = length;
				break;
			}
			end++;
		}

		// 범위 정보 저장
		ranges.push({
			start,
			end: end, // end는 변경지점이므로 -1
			value: initialStyle,
		});

		// 다음 범위의 시작점으로 이동 (수정된 부분)
		start = end; // end - 1 대신 end를 사용
		end = start + 1;
	}

	return ranges;
}

// 스타일별 Range 처리 함수들
function getFontSizeRanges(textNode: TextNode): StyleRange<number>[] | null {
	if (textNode.fontSize === figma.mixed) {
		return getStyleRanges<number>(textNode, textNode.getRangeFontSize);
	}
	if (textNode.fontSize == null) {
		return null;
	}
	return [
		{
			start: 0,
			end: textNode.characters.length,
			value: textNode.fontSize,
		},
	];
}

function getFontNameRanges(textNode: TextNode): StyleRange<FontName>[] | null {
	if (textNode.fontName === figma.mixed) {
		return getStyleRanges<FontName>(textNode, textNode.getRangeFontName);
	}
	if (textNode.fontName == null) {
		return null;
	}
	return [
		{
			start: 0,
			end: textNode.characters.length,
			value: textNode.fontName,
		},
	];
}

function getLineHeightRanges(textNode: TextNode): StyleRange<LineHeight>[] | null {
	if (textNode.lineHeight === figma.mixed) {
		return getStyleRanges<LineHeight>(textNode, textNode.getRangeLineHeight);
	}
	if (textNode.lineHeight == null) {
		return null;
	}
	return [
		{
			start: 0,
			end: textNode.characters.length,
			value: textNode.lineHeight,
		},
	];
}

function getLetterSpacingRanges(textNode: TextNode): StyleRange<LetterSpacing>[] | null {
	if (textNode.letterSpacing === figma.mixed) {
		return getStyleRanges<LetterSpacing>(textNode, textNode.getRangeLetterSpacing);
	}
	if (textNode.letterSpacing == null || textNode.letterSpacing.value === 0) {
		return null;
	}
	return [
		{
			start: 0,
			end: textNode.characters.length,
			value: textNode.letterSpacing,
		},
	];
}

function getTextDecorationRanges(textNode: TextNode): StyleRange<TextDecoration>[] | null {
	if (textNode.textDecoration === figma.mixed) {
		return getStyleRanges<TextDecoration>(textNode, textNode.getRangeTextDecoration);
	}
	if (textNode.textDecoration == null || textNode.textDecoration === 'NONE') {
		return null;
	}
	return [
		{
			start: 0,
			end: textNode.characters.length,
			value: textNode.textDecoration,
		},
	];
}

function getTextCaseRanges(textNode: TextNode): StyleRange<TextCase>[] | null {
	if (textNode.textCase === figma.mixed) {
		return getStyleRanges<TextCase>(textNode, textNode.getRangeTextCase);
	}
	if (textNode.textCase == null || textNode.textCase === 'ORIGINAL') {
		return null;
	}
	return [
		{
			start: 0,
			end: textNode.characters.length,
			value: textNode.textCase,
		},
	];
}

function getTextStyleIdRanges(textNode: TextNode): StyleRange<string>[] | null {
	if (textNode.textStyleId === figma.mixed) {
		return getStyleRanges<string>(textNode, textNode.getRangeTextStyleId);
	}
	if (textNode.textStyleId == null || textNode.textStyleId === '') {
		return null;
	}
	return [
		{
			start: 0,
			end: textNode.characters.length,
			value: textNode.textStyleId,
		},
	];
}

function getFontWeightRanges(textNode: TextNode): StyleRange<number>[] | null {
	if (textNode.fontWeight === figma.mixed) {
		return getStyleRanges<number>(textNode, textNode.getRangeFontWeight);
	}
	if (textNode.fontWeight == null) {
		return null;
	}
	return [
		{
			start: 0,
			end: textNode.characters.length,
			value: textNode.fontWeight,
		},
	];
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
		return getStyleRanges<{ [feature in OpenTypeFeature]: boolean }>(textNode, textNode.getRangeOpenTypeFeatures);
	}
	if (textNode.openTypeFeatures == null || Object.keys(textNode.openTypeFeatures).length === 0) {
		return null;
	}
	return [
		{
			start: 0,
			end: textNode.characters.length,
			value: textNode.openTypeFeatures,
		},
	];
}

function getHyperlinkRanges(textNode: TextNode): StyleRange<HyperlinkTarget | null>[] | null {
	if (textNode.hyperlink === figma.mixed) {
		return getStyleRanges<HyperlinkTarget | null>(textNode, textNode.getRangeHyperlink);
	}
	if (textNode.hyperlink == null || textNode.hyperlink.value === '') {
		return null;
	}
	return [
		{
			start: 0,
			end: textNode.characters.length,
			value: textNode.hyperlink,
		},
	];
}

function getFillsRanges(textNode: TextNode): StyleRange<Paint[]>[] | null {
	if (textNode.fills === figma.mixed) {
		return getStyleRanges<Paint[]>(textNode, textNode.getRangeFills);
	}
	if (textNode.fills == null || textNode.fills.length === 0) {
		return null;
	}
	return [
		{
			start: 0,
			end: textNode.characters.length,
			value: textNode.fills as Paint[],
		},
	];
}

function getFillStyleIdRanges(textNode: TextNode): StyleRange<string>[] | null {
	if (textNode.fillStyleId === figma.mixed) {
		return getStyleRanges<string>(textNode, textNode.getRangeFillStyleId);
	}
	if (textNode.fillStyleId == null || textNode.fillStyleId === '') {
		return null;
	}
	return [
		{
			start: 0,
			end: textNode.characters.length,
			value: textNode.fillStyleId,
		},
	];
}

/** TODO: 값이 약간 다름.. 체크 해야함.. */
const targetVariableBindableFields = [
	'fontFamily',
	'fontSize',
	'fontStyle',
	'fontWeight',
	'letterSpacing',
	'lineHeight',
];

function getBoundVariablesRanges(textNode: TextNode): any {
	const keys = Object.keys(textNode.boundVariables as Record<string, string>);

	const values = {} as Record<
		string,
		ValidStyleRange<{
			type: string;
			id: string;
		}>[]
	>;

	if (keys.length > 0) {
		for (const key of keys) {
			if (targetVariableBindableFields.includes(key)) {
				const value = getBoundVariableStyleRanges<string>(
					textNode,
					key as VariableBindableTextField,
					textNode.getRangeBoundVariable
				);

				values[key] = value as any;
			}
		}
		return values;
	}
	return {};
}

// 모든 스타일 Range를 가져오는 함수
export interface AllStyleRanges {
	fontSize?: StyleRange<number>[] | null;
	fontName?: StyleRange<FontName>[] | null;
	lineHeight?: StyleRange<LineHeight>[] | null;
	letterSpacing?: StyleRange<LetterSpacing>[] | null;
	textDecoration?: StyleRange<TextDecoration>[] | null;
	textCase?: StyleRange<TextCase>[] | null;
	textStyleId?: StyleRange<string>[] | null;
	fontWeight?: StyleRange<number>[] | null;

	openTypeFeatures?: StyleRange<{ [feature in OpenTypeFeature]: boolean }>[] | null;
	hyperlink?: StyleRange<HyperlinkTarget | null>[] | null;
	fills?: StyleRange<Paint[]>[] | null;
	fillStyleId?: StyleRange<string>[] | null;
	boundVariables?: any;
	// listOptions: StyleRange<TextListOptions>[] | null
	// indentation: StyleRange<number>[] | null
}

interface ValidStyleRange<T> {
	start: number;
	end: number;
	value: T;
}

export type ValidAllStyleRangesType = {
	fontSize?: ValidStyleRange<number>[];
	fontName?: ValidStyleRange<FontName>[];
	lineHeight?: ValidStyleRange<LineHeight>[];
	letterSpacing?: ValidStyleRange<LetterSpacing>[];
	textDecoration?: ValidStyleRange<TextDecoration>[];
	textCase?: ValidStyleRange<TextCase>[];
	textStyleId?: ValidStyleRange<string>[];
	fontWeight?: ValidStyleRange<number>[];
	openTypeFeatures?: ValidStyleRange<{ [feature in OpenTypeFeature]: boolean }>[];
	hyperlink?: ValidStyleRange<HyperlinkTarget>[];
	fills?: ValidStyleRange<Paint[]>[];
	fillStyleId?: ValidStyleRange<string>[];
	boundVariables?: ValidStyleRange<{
		type: string;
		id: string;
	}>[];
	// boundVariables?: Record<
	// 	string,
	// 	ValidStyleRange<{
	// 		type: string
	// 		id: string
	// 	}>[]
	// >
};

// 외부 DB 써써 데이터 저장한 다음 고유키 발급 받기?

// const workQueue = [
// 	'fontSize',
// 	'fontName',
// 	'lineHeight',
// 	'letterSpacing',
// 	'textDecoration',
// 	'textCase',
// 	'hyperlink',
// 	'fills',
// 	'textStyleId',
// 	'fillStyleId',
// 	'boundVariables',
// ]

export const setAllStyleRanges = async ({
	textNode,
	styleData,
	boundVariables,
	range,
	xNodeId,
}: {
	xNodeId: string;
	textNode: TextNode;
	styleData: Record<string, any>;
	boundVariables?: any;
	range: {
		start: number;
		end: number;
	};
}) => {
	// const functionMapSample = {
	// 	fontSize: textNode.setRangeFontSize,
	// 	fontName: textNode.setRangeFontName,
	// 	lineHeight: textNode.setRangeLineHeight,
	// 	letterSpacing: textNode.setRangeLetterSpacing,
	// 	textDecoration: textNode.setRangeTextDecoration,
	// 	textCase: textNode.setRangeTextCase,
	// 	// fontWeight: textNode.setRangeFontWeight,
	// 	hyperlink: textNode.setRangeHyperlink,
	// 	fills: textNode.setRangeFills,
	// 	// openTypeFeatures: textNode.openTypeFeatures,
	// 	textStyleId: textNode.setRangeTextStyleIdAsync,
	// 	fillStyleId: textNode.setRangeFillStyleIdAsync,
	// }
	const functionMap = {
		fontName: 'setRangeFontName',
		fontSize: 'setRangeFontSize',
		lineHeight: 'setRangeLineHeight',
		letterSpacing: 'setRangeLetterSpacing',
		textDecoration: 'setRangeTextDecoration',
		textCase: 'setRangeTextCase',
		// fontWeight: "setRangeFontWeight",
		hyperlink: 'setRangeHyperlink',
		fills: 'setRangeFills',
		// openTypeFeatures: "openTypeFeatures",
		textStyleId: 'setRangeTextStyleIdAsync',
		fillStyleId: 'setRangeFillStyleIdAsync',
	} as const;
	// textNode.setRangeBoundVariable,
	for (const key of Object.keys(functionMap)) {
		const style = styleData[key as keyof ResourceDTO];
		if (style == null) {
			continue;
		}
		if (key === 'fontName') {
			await figma.loadFontAsync(style as FontName);
		}
		try {
			const setRange = textNode[functionMap[key as keyof typeof functionMap]] as Function;
			if (setRange) {
				textNode[functionMap[key as keyof typeof functionMap]](range.start, range.end, style as never);
			}
		} catch (error) {
			const targetNode = (await figma.getNodeByIdAsync(xNodeId)) as TextNode;
			if (targetNode) {
				const setRange = targetNode[functionMap[key as keyof typeof functionMap]] as Function;
				if (setRange) {
					targetNode[functionMap[key as keyof typeof functionMap]](range.start, range.end, style as never);
				}
			}
		}
	}
};

export function getAllStyleRanges(textNode: TextNode): { styleData: ValidAllStyleRangesType; boundVariables: any } {
	const boundVariables = getBoundVariablesRanges(textNode);

	const styleData: AllStyleRanges = {
		fontSize: getFontSizeRanges(textNode),
		fontName: getFontNameRanges(textNode),
		lineHeight: getLineHeightRanges(textNode),
		letterSpacing: getLetterSpacingRanges(textNode),
		textDecoration: getTextDecorationRanges(textNode),
		textCase: getTextCaseRanges(textNode),

		// 설정 할 때 필요 없음 이유는 weight 값으로 스타일이 적용되지 않기 때문 스타일은 fontName으로 적용 됨
		// fontWeight: getFontWeightRanges(textNode),
		hyperlink: getHyperlinkRanges(textNode),
		fills: getFillsRanges(textNode),
		openTypeFeatures: getOpenTypeFeaturesRanges(textNode),

		// 나중에는 분리해서 스타일 호출 순서를 지정하고 관리해야하는데 일단 지금은 range를 유효하게 뽑는게 중요하므로 생략함
		fillStyleId: getFillStyleIdRanges(textNode),
		textStyleId: getTextStyleIdRanges(textNode),
	};

	const styleIds = {
		fillStyleId: getFillStyleIdRanges(textNode),
		textStyleId: getTextStyleIdRanges(textNode),
	};

	for (const key in styleData) {
		if (styleData[key as keyof AllStyleRanges] == null) {
			delete styleData[key as keyof AllStyleRanges];
		}
	}

	return { styleData: styleData as ValidAllStyleRangesType, boundVariables };
}

export const textFontLoad = async (textNode: TextNode) => {
	const arr = getFontNameRanges(textNode);

	if (arr) {
		for (const item of arr) {
			const fontName = item.value as FontName;

			await figma.loadFontAsync(fontName);
		}
	}
	return;
};
