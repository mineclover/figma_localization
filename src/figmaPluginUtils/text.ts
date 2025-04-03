import { StyleData } from '@/model/signal';
import { ResourceDTO } from '@/model/types';
import { deepEqual } from '@/utils/data';

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

function getParagraphSpacingRanges(textNode: TextNode): StyleRange<number>[] | null {
	if (textNode.paragraphSpacing == null || textNode.paragraphSpacing === 0) {
		return null;
	}
	return [
		{
			start: 0,
			end: textNode.characters.length,
			value: textNode.paragraphSpacing,
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

function getTextDecorationStyleRanges(textNode: TextNode): StyleRange<TextDecorationStyle>[] | null {
	if (textNode.textDecorationStyle === figma.mixed) {
		return getStyleRanges<TextDecorationStyle>(textNode, textNode.getRangeTextDecorationStyle);
	}
	if (textNode.textDecorationStyle == null || textNode.textDecorationStyle) {
		return null;
	}
	return [
		{
			start: 0,
			end: textNode.characters.length,
			value: textNode.textDecorationStyle,
		},
	];
}

function getTextDecorationOffsetRanges(textNode: TextNode): StyleRange<TextDecorationOffset>[] | null {
	if (textNode.textDecorationOffset === figma.mixed) {
		return getStyleRanges<TextDecorationOffset>(textNode, textNode.getRangeTextDecorationOffset);
	}
	if (textNode.textDecorationOffset == null || textNode.textDecorationOffset) {
		return null;
	}
	return [
		{
			start: 0,
			end: textNode.characters.length,
			value: textNode.textDecorationOffset,
		},
	];
}

function getTextDecorationThicknessRanges(textNode: TextNode): StyleRange<TextDecorationThickness>[] | null {
	if (textNode.textDecorationThickness === figma.mixed) {
		return getStyleRanges<TextDecorationThickness>(textNode, textNode.getRangeTextDecorationThickness);
	}
	if (textNode.textDecorationThickness == null || textNode.textDecorationThickness) {
		return null;
	}
	return [
		{
			start: 0,
			end: textNode.characters.length,
			value: textNode.textDecorationThickness,
		},
	];
}
function getTextDecorationColorRanges(textNode: TextNode): StyleRange<TextDecorationColor>[] | null {
	if (textNode.textDecorationColor === figma.mixed) {
		return getStyleRanges<TextDecorationColor>(textNode, textNode.getRangeTextDecorationColor);
	}
	if (textNode.textDecorationColor == null || textNode.textDecorationColor) {
		return null;
	}
	return [
		{
			start: 0,
			end: textNode.characters.length,
			value: textNode.textDecorationColor,
		},
	];
}

function getTextDecorationSkipInkRanges(textNode: TextNode): StyleRange<boolean>[] | null {
	if (textNode.textDecorationSkipInk === figma.mixed) {
		return getStyleRanges<boolean>(textNode, textNode.getRangeTextDecorationSkipInk);
	}
	if (textNode.textDecorationSkipInk == null || textNode.textDecorationSkipInk) {
		return null;
	}
	return [
		{
			start: 0,
			end: textNode.characters.length,
			value: textNode.textDecorationSkipInk,
		},
	];
}

export const getTextDecorationSkipInk = (textNode: TextNode): StyleRange<TextDecoration>[] | null => {
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
};

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

// 있긴 한데 폰트 페밀리에서 얻어서 안쓰는 것 같음
// function getFontWeightRanges(textNode: TextNode): StyleRange<number>[] | null {
// 	if (textNode.fontWeight === figma.mixed) {
// 		return getStyleRanges<number>(textNode, textNode.getRangeFontWeight);
// 	}
// 	if (textNode.fontWeight == null) {
// 		return null;
// 	}
// 	return [
// 		{
// 			start: 0,
// 			end: textNode.characters.length,
// 			value: textNode.fontWeight,
// 		},
// 	];
// }

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

/**
 * 텍스트가 리스트 객체로 정의된 경우에 대한 판단
 * 기본적으로 줄바꿈이 있는 텍스트에서 표현되기에 조건부가 없음
 */
function getListOptionsRanges(textNode: TextNode): StyleRange<TextListOptions>[] | null {
	return getStyleRanges<TextListOptions>(textNode, textNode.getRangeListOptions);
}

function getListSpacingRanges(textNode: TextNode): StyleRange<number>[] | null {
	if (textNode.listSpacing == null || textNode.listSpacing === 0) {
		return null;
	}
	return [
		{
			start: 0,
			end: textNode.characters.length,
			value: textNode.listSpacing,
		},
	];
}

function getParagraphIndentRanges(textNode: TextNode): StyleRange<number>[] | null {
	if (textNode.paragraphIndent == null || textNode.paragraphIndent === 0) {
		return null;
	}
	return [
		{
			start: 0,
			end: textNode.characters.length,
			value: textNode.paragraphIndent,
		},
	];
}

/** 기본 값이 줄 단위로 들어가기에 */
function getIndentationRanges(textNode: TextNode): StyleRange<number>[] | null {
	return getStyleRanges<number>(textNode, textNode.getRangeIndentation);
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

	textCase?: StyleRange<TextCase>[] | null;
	textStyleId?: StyleRange<string>[] | null;
	// fontWeight?: StyleRange<number>[] | null; // styleData에서 사용하지 않음 (주석처리됨)

	// openTypeFeatures?: StyleRange<{ [feature in OpenTypeFeature]: boolean }>[] | null; // styleData에서 사용하지 않음 (주석처리됨)
	hyperlink?: StyleRange<HyperlinkTarget | null>[] | null;
	fills?: StyleRange<Paint[]>[] | null;
	fillStyleId?: StyleRange<string>[] | null;
	// boundVariables?: any; // 별도로 처리됨
	listOptions: StyleRange<TextListOptions>[] | null;
	listSpacing: StyleRange<number>[] | null;
	indentation: StyleRange<number>[] | null;
	textDecoration?: StyleRange<TextDecoration>[] | null;
	textDecorationStyle?: StyleRange<TextDecorationStyle>[] | null;
	textDecorationColor?: StyleRange<TextDecorationColor>[] | null;
	textDecorationOffset?: StyleRange<TextDecorationOffset>[] | null;
	textDecorationThickness?: StyleRange<TextDecorationThickness>[] | null;
	textDecorationSkipInk?: StyleRange<boolean>[] | null;

	paragraphSpacing?: StyleRange<number>[] | null;
	paragraphIndent?: StyleRange<number>[] | null;

	// strokes?: ValidStyleRange<Paint[]>[] | null; // styleData에서 사용하지 않음
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
	textDecorationColor?: ValidStyleRange<TextDecorationColor>[];
	textDecorationOffset?: ValidStyleRange<TextDecorationOffset>[];
	textDecorationThickness?: ValidStyleRange<TextDecorationThickness>[];
	textDecorationSkipInk?: ValidStyleRange<boolean>[];
	leadingTrim?: ValidStyleRange<LeadingTrim>[];
	paragraphSpacing?: ValidStyleRange<number>[];
	paragraphIndent?: ValidStyleRange<number>[];

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

const rangeFunctionMap = {
	// Text styling
	fontName: 'setRangeFontName',
	fontSize: 'setRangeFontSize',
	lineHeight: 'setRangeLineHeight',
	letterSpacing: 'setRangeLetterSpacing',
	textDecoration: 'setRangeTextDecoration',
	textCase: 'setRangeTextCase',
	// fontWeight: "setRangeFontWeight", // No corresponding setter exists
	hyperlink: 'setRangeHyperlink',
	fills: 'setRangeFills',
	// openTypeFeatures: "openTypeFeatures", // No corresponding setter exists

	// Text decoration details
	textDecorationStyle: 'setRangeTextDecorationStyle',
	textDecorationOffset: 'setRangeTextDecorationOffset',
	textDecorationThickness: 'setRangeTextDecorationThickness',
	textDecorationColor: 'setRangeTextDecorationColor',
	textDecorationSkipInk: 'setRangeTextDecorationSkipInk',
	// List and paragraph formatting
	listOptions: 'setRangeListOptions',
	listSpacing: 'setRangeListSpacing',
	paragraphIndent: 'setRangeParagraphIndent',
	paragraphSpacing: 'setRangeParagraphSpacing',
	indentation: 'setRangeIndentation',
	// Variable binding
	textStyleId: 'setRangeTextStyleIdAsync',
	// boundVariable: 'setRangeBoundVariable'
	// 나머지 range
} as const;

const boundVariablesMap = {
	fontFamily: 'fontFamily',
	fontSize: 'fontSize',
	fontStyle: 'fontStyle',
	fontWeight: 'fontWeight',
	letterSpacing: 'letterSpacing',
	lineHeight: 'lineHeight',
	paragraphSpacing: 'paragraphSpacing',
	paragraphIndent: 'paragraphIndent',
} as const;
const functionMap = {
	textStyleId: 'setTextStyleIdAsync',
	fillStyleId: 'setFillStyleIdAsync',
	effectStyleId: 'setEffectStyleIdAsync',
	strokeStyleId: 'setStrokeStyleIdAsync',
	reactions: 'setReactionsAsync',
} as const;

export const setAllStyleRanges = async ({
	textNode,
	styleData,

	range,
	xNodeId,
}: {
	/** 노드 데이터가 옛날 스코프일 때 실시간 조회해서 다시 찾는 목적 */
	xNodeId: string;
	textNode: TextNode;
	styleData: StyleData;

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

	// 스타일데이터 내에서의 boundVariables 가 유효한게 맞음
	const { boundVariables, effectStyleData, styleData: tempStyleData } = styleData;

	const styles = {
		...effectStyleData,
		...tempStyleData,
	};

	// textNode.setRangeBoundVariable,
	for (const key of Object.keys(rangeFunctionMap)) {
		const style = styles[key as keyof ResourceDTO];
		if (style == null) {
			continue;
		}
		if (key === 'fontName') {
			await figma.loadFontAsync(style as FontName);
		}
		try {
			const setRange = textNode[rangeFunctionMap[key as keyof typeof rangeFunctionMap]] as Function;
			if (setRange) {
				textNode[rangeFunctionMap[key as keyof typeof rangeFunctionMap]](range.start, range.end, style as never);
			}
		} catch (error) {
			const targetNode = (await figma.getNodeByIdAsync(xNodeId)) as TextNode;
			if (targetNode) {
				const setRange = targetNode[rangeFunctionMap[key as keyof typeof rangeFunctionMap]] as Function;
				if (setRange) {
					targetNode[rangeFunctionMap[key as keyof typeof rangeFunctionMap]](range.start, range.end, style as never);
				}
			}
		}
	}

	if (boundVariables) {
		for (const field of Object.keys(boundVariablesMap)) {
			const value = boundVariables[field as keyof typeof boundVariables];

			if (value) {
				await textNode.setRangeBoundVariable(
					range.start,
					range.end,
					field as VariableBindableTextField,
					value as never
				);
			}
		}
	}

	for (const key of Object.keys(functionMap)) {
		const style = styles[key as keyof ResourceDTO];
		if (style == null) {
			continue;
		}
		const setRange = textNode[functionMap[key as keyof typeof functionMap]] as Function;
		if (setRange) {
			await textNode[functionMap[key as keyof typeof functionMap]](style);
		}
	}

	for (const key of Object.keys(effectFunctionMap)) {
		const style = styles[key as keyof ResourceDTO];
		// ;
		if (style == null) {
			continue;
		}

		// 인스턴스인 경우 constraints 속성을 변경하지 않음
		if (key === 'constraints' && textNode.parent && textNode.parent.type === 'INSTANCE') {
			console.log('인스턴스 내부의 노드에서는 constraints 속성을 변경할 수 없습니다.');
			continue;
		}

		try {
			textNode[effectFunctionMap[key as keyof typeof effectFunctionMap]] = style as never;
		} catch (error) {
			console.error(`속성 설정 중 오류 발생: ${key}`, error);
		}
	}
};

export const setResetStyle = async ({
	textNode,
}: {
	/** 노드 데이터가 옛날 스코프일 때 실시간 조회해서 다시 찾는 목적 */

	textNode: TextNode;
}) => {
	// textNode.setRangeBoundVariable,
	for (const key of Object.keys(effectFunctionMap)) {
		const style = defaultEffectStyleData[key as keyof typeof defaultEffectStyleData];
		// ;
		if (style == null) {
			continue;
		}

		// 인스턴스인 경우 constraints 속성을 변경하지 않음
		if (key === 'constraints' && textNode.parent && textNode.parent.type === 'INSTANCE') {
			console.log('인스턴스 내부의 노드에서는 constraints 속성을 변경할 수 없습니다.');
			continue;
		}

		try {
			textNode[effectFunctionMap[key as keyof typeof effectFunctionMap]] = style as never;
		} catch (error) {
			console.error(`속성 설정 중 오류 발생: ${key}`, error);
		}
	}
	for (const key of Object.keys(rangeFunctionMap)) {
		const style = defaultRangeData[key as keyof typeof defaultRangeData];

		if (style == null) {
			continue;
		}
		if (key === 'fontName') {
			await figma.loadFontAsync(style as FontName);
		}
		const setRange = textNode[rangeFunctionMap[key as keyof typeof rangeFunctionMap]] as Function;
		if (setRange) {
			await textNode[rangeFunctionMap[key as keyof typeof rangeFunctionMap]](
				0,
				textNode.characters.length,
				style as never
			);
		}
	}
};

export type EffectStyleData = Record<string, any[]>;
type Prettify<T> = {
	[K in keyof T]: T[K];
} & {};
export type PlanType = Prettify<TextNode>;

export function getAllStyleRanges(textNode: TextNode): {
	styleData: ValidAllStyleRangesType;
	boundVariables: any;
	effectStyleData: EffectStyleData;
} {
	// 텍스트 노드만을 위한 개념임
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
		// openTypeFeatures: getOpenTypeFeaturesRanges(textNode),

		// Text decoration details
		textDecorationStyle: getTextDecorationStyleRanges(textNode),
		textDecorationColor: getTextDecorationColorRanges(textNode),
		textDecorationOffset: getTextDecorationOffsetRanges(textNode),
		textDecorationThickness: getTextDecorationThicknessRanges(textNode),
		textDecorationSkipInk: getTextDecorationSkipInkRanges(textNode),

		// List and paragraph formatting
		listOptions: getListOptionsRanges(textNode),
		listSpacing: getListSpacingRanges(textNode),
		paragraphIndent: getParagraphIndentRanges(textNode),
		paragraphSpacing: getParagraphSpacingRanges(textNode),
		indentation: getIndentationRanges(textNode),

		// 나중에는 분리해서 스타일 호출 순서를 지정하고 관리해야하는데 일단 지금은 range를 유효하게 뽑는게 중요하므로 생략함
		fillStyleId: getFillStyleIdRanges(textNode),
		textStyleId: getTextStyleIdRanges(textNode),
	};
	const singleBoundVariables = textNode.boundVariables as Record<string, VariableAlias>;

	const effectStyleData = {
		strokes: textNode.strokes,
		strokeWeight: textNode.strokeWeight,
		strokeAlign: textNode.strokeAlign,
		strokeCap: textNode.strokeCap,
		strokeJoin: textNode.strokeJoin,
		strokeMiterLimit: textNode.strokeMiterLimit,
		opacity: textNode.opacity,
		blendMode: textNode.blendMode,
		textAlignHorizontal: textNode.textAlignHorizontal,
		textAlignVertical: textNode.textAlignVertical,
		textAutoResize: textNode.textAutoResize,
		textTruncation: textNode.textTruncation,
		maxLines: textNode.maxLines,
		targetAspectRatio: textNode.targetAspectRatio,
		annotations: textNode.annotations,
		hangingPunctuation: textNode.hangingPunctuation,
		hangingList: textNode.hangingList,
		constraints: textNode.constraints,
		reactions: textNode.reactions,
		isMask: textNode.isMask,
		maskType: textNode.maskType,
		effects: textNode.effects,
		effectStyleId: textNode.effectStyleId,
		layoutAlign: textNode.layoutAlign,
		layoutGrow: textNode.layoutGrow,
		layoutPositioning: textNode.layoutPositioning,
		layoutSizingHorizontal: textNode.layoutSizingHorizontal,
		layoutSizingVertical: textNode.layoutSizingVertical,
		leadingTrim: textNode.leadingTrim,
		rotation: textNode.rotation,
		locked: textNode.locked,
		visible: textNode.visible,
		// 위치 값
		// absoluteBoundingBox: textNode.absoluteBoundingBox,
		// 추가된 누락 속성들
		minWidth: textNode.minWidth,
		maxWidth: textNode.maxWidth,
		minHeight: textNode.minHeight,
		maxHeight: textNode.maxHeight,
		boundVariables: singleBoundVariables,
	} as const;

	// 변수 적용 가능 필드명
	// VariableBindableNodeField

	// const styleIds = {
	// 	fillStyleId: getFillStyleIdRanges(textNode),
	// 	textStyleId: getTextStyleIdRanges(textNode),
	// };
	for (const key of targetVariableBindableFields) {
		delete singleBoundVariables[key];
	}
	for (const key in styleData) {
		if (styleData[key as keyof AllStyleRanges] == null) {
			delete styleData[key as keyof AllStyleRanges];
		}
	}
	for (const key in effectStyleData) {
		const target = effectStyleData[key as keyof typeof effectStyleData];
		if (target == null) {
			delete effectStyleData[key as keyof typeof effectStyleData];
		} else if (defaultEffectStyleData[key as keyof typeof defaultEffectStyleData] == target) {
			delete effectStyleData[key as keyof typeof effectStyleData];
		} else if (
			typeof target === 'object' &&
			deepEqual(target, defaultEffectStyleData[key as keyof typeof defaultEffectStyleData])
		) {
			delete effectStyleData[key as keyof typeof effectStyleData];
		} else if (typeof target === 'object' && Object.keys(target).length === 0) {
			delete effectStyleData[key as keyof typeof effectStyleData];
		} else if (Array.isArray(target) && target.length === 0) {
			delete effectStyleData[key as keyof typeof effectStyleData];
		}
	}

	return {
		styleData: styleData as ValidAllStyleRangesType,
		boundVariables,
		effectStyleData: effectStyleData as unknown as EffectStyleData,
	};
}

export const textFontLoad = async (textNode: TextNode) => {
	const arr = getFontNameRanges(textNode);

	if (arr) {
		for (const item of arr) {
			const fontName = item.value as FontName;
			try {
				await figma.loadFontAsync(fontName);
			} catch (error) {
				console.log(`Failed to load font: ${fontName}`, error);
			}
		}
	}
	return;
};

const effectFunctionMap = {
	// 스트로크 관련
	strokes: 'strokes',
	strokeWeight: 'strokeWeight',
	strokeAlign: 'strokeAlign',
	strokeCap: 'strokeCap',
	strokeJoin: 'strokeJoin',
	strokeMiterLimit: 'strokeMiterLimit',

	// 일반 스타일 관련
	opacity: 'opacity',
	blendMode: 'blendMode',
	effects: 'effects',

	// 텍스트 정렬 관련
	textAlignHorizontal: 'textAlignHorizontal',
	textAlignVertical: 'textAlignVertical',
	textAutoResize: 'textAutoResize',
	textTruncation: 'textTruncation',
	maxLines: 'maxLines',

	// 레이아웃 관련
	// 기존 사이즈를 기반으로 레이아웃 적용됨
	// targetAspectRatio: 'targetAspectRatio',
	constraints: 'constraints',
	layoutAlign: 'layoutAlign',
	layoutGrow: 'layoutGrow',
	layoutPositioning: 'layoutPositioning',
	layoutSizingHorizontal: 'layoutSizingHorizontal',
	layoutSizingVertical: 'layoutSizingVertical',

	// 크기 제한 관련
	minWidth: 'minWidth',
	maxWidth: 'maxWidth',
	minHeight: 'minHeight',
	maxHeight: 'maxHeight',

	// 기타 설정

	hangingPunctuation: 'hangingPunctuation',
	hangingList: 'hangingList',
	leadingTrim: 'leadingTrim',
	rotation: 'rotation',
	locked: 'locked',
	visible: 'visible',
	isMask: 'isMask',
	maskType: 'maskType',
} as const;

export const defaultEffectStyleData = {
	strokes: [],
	strokeWeight: 1,
	strokeAlign: 'OUTSIDE',
	strokeCap: 'NONE',
	strokeJoin: 'MITER',
	strokeMiterLimit: 4,
	opacity: 1,
	blendMode: 'PASS_THROUGH',
	textAlignHorizontal: 'CENTER',
	textAlignVertical: 'CENTER',
	textAutoResize: 'WIDTH_AND_HEIGHT',
	textTruncation: 'DISABLED',
	maxLines: null,

	hangingPunctuation: false,
	hangingList: false,
	constraints: {
		horizontal: 'MIN',
		vertical: 'MIN',
	},

	isMask: false,
	maskType: 'ALPHA',
	effects: [],

	layoutAlign: 'INHERIT',
	layoutGrow: 0,
	layoutPositioning: 'AUTO',
	layoutSizingHorizontal: 'FIXED',
	layoutSizingVertical: 'FIXED',
	leadingTrim: 'NONE',
	rotation: 0,
	locked: false,
	visible: true,
	minWidth: null,
	maxWidth: null,
	minHeight: null,
	maxHeight: null,
} as const;

export const defaultRangeData = {
	fontSize: 14,
	fontName: { family: 'Inter', style: 'Regular' },
	lineHeight: {
		unit: 'AUTO',
	},
	letterSpacing: { unit: 'PERCENT', value: 0 },
	textDecoration: 'NONE',
	textCase: 'ORIGINAL',
	hyperlink: null,
	fills: [
		{
			type: 'SOLID',
			visible: true,
			opacity: 1,
			blendMode: 'NORMAL',
			color: {
				r: 1,
				g: 1,
				b: 1,
			},
			boundVariables: {},
		},
	],
	// textDecoration 가 NONE 이면 설정하지 않아도 됨
	// textDecorationStyle: 'SOLID',
	// textDecorationColor: {
	// 	value: 'AUTO',
	// },
	// textDecorationOffset: {
	// 	unit: 'AUTO',
	// },
	// textDecorationThickness: {
	// 	unit: 'AUTO',
	// },
	// textDecorationSkipInk: false,
	listOptions: {
		type: 'NONE',
	},
	listSpacing: 0,
	paragraphIndent: 0,
	paragraphSpacing: 0,
	indentation: 0,
	fillStyleId: '',
	textStyleId: '',
};
