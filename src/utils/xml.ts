import { XMLParser } from 'fast-xml-parser';

export type ParseTextBlock = {
	[key: string]: {
		'#text': string;
		[key: string]: ParseTextBlock | string;
	}[];
};

/**
 * 지금 로직에서 에러 파싱 남
 * [0].root 반환하는 코드
 */
export const parseXML = (xml: string) => {
	const saveXml = xml.replace(/<br\/>/g, '\n');

	const parser = new XMLParser({
		ignoreAttributes: false,
		trimValues: false,
		preserveOrder: true,
		isArray: (name, jpath, isLeafNode, isAttribute) => {
			// 배열로 처리하고 싶은 요소들을 지정
			return false;
		},
	});
	const parsedObj = parser.parse(`<root>${saveXml}</root>`);
	const parsedDataArr = parsedObj[0].root as ParseTextBlock[];
	return parsedDataArr;
};

/** 재귀 호출 방식으로 파싱하도록 변경함 */
export const parseTextBlock = (block: ParseTextBlock) => {
	const keys = Object.keys(block);

	const result = keys
		.map((key): string => {
			const target = block[key];
			if (key === '#text' && typeof target === 'string') {
				return target;
			}
			// @ts-ignore
			const t = parseTextBlock(target);
			if (t === '' && key === 'br') {
				return '\n';
			}
			return t;
		})

		.join('');

	return result;
};

// export const parseTextBlock = (block: ParseTextBlock) => {

// 	const key = Object.keys(block)[0];
// 	const target = block[key];
// 	const value = target[0];

// 	return value['#text'];
// };

export const parseTextBlock2 = (
	block: ParseTextBlock,
	result: Record<string, string> = {},
	path: string = ''
): Record<string, string> => {
	const key = Object.keys(block)[0];
	const target = block[key];

	// 현재 경로 업데이트
	const currentPath = path ? `${path}.${key}` : key;

	// 배열 항목 순회
	target.forEach((item: any, index: number) => {
		const itemPath = `${currentPath}[${index}]`;

		// '#text' 속성이 있으면 결과에 추가
		if (item['#text'] !== undefined) {
			result[itemPath] = item['#text'];
		}

		// 다른 키가 있는지 확인하고 재귀적으로 처리
		for (const subKey of Object.keys(item)) {
			if (subKey !== '#text' && Array.isArray(item[subKey])) {
				const subBlock = { [subKey]: item[subKey] };
				parseTextBlock2(subBlock, result, itemPath);
			}
		}
	});

	return result;
};

// 텍스트만 추출하는 간단한 헬퍼 함수
export const extractAllText = (block: ParseTextBlock): string[] => {
	const parsed = parseTextBlock2(block);
	return Object.values(parsed);
};

// 원본 간단한 함수를 유지하고 싶다면 이렇게 별도로 남겨둘 수도 있음
export const parseTextBlockSimple = (block: ParseTextBlock) => {
	const key = Object.keys(block)[0];
	const target = block[key];
	const value = target[0];

	return value['#text'];
};

export const parseXML2 = (xml: string) => {
	const saveXml = xml.replace(/<br\/>/g, '\n');
	const parser = new XMLParser({
		ignoreAttributes: false,
		trimValues: false,
		preserveOrder: true,
		isArray: (name, jpath, isLeafNode, isAttribute) => {
			// 배열로 처리하고 싶은 요소들을 지정
			return false;
		},
	});
	const parsedObj = parser.parse(`<root>${saveXml}</root>`);
	const parsedDataArr = parsedObj as ParseTextBlock[];
	return parsedDataArr;
};

export const textExtract = (xml: string) => {
	const result = parseXML2(xml);
	const result3 = extractAllText(result[0]).join('');
	return result3;
};

/** xml 이면 true 반환 */
export const isXmlCheck = (xml: string) => {
	const result = parseXML(xml);
	if (result.length === 1) {
		const block = result[0];
		if (Array.isArray(block)) {
			return true;
		} else if (typeof block === 'object') {
			const key = Object.keys(block);
			if (key.length === 1) {
				if (key[0] === '#text') {
					return false;
				}
				return true;
			} else {
				return true;
			}
		}
		return true;
	}
	return true;
};
