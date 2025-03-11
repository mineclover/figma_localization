import { XMLParser } from 'fast-xml-parser';

export type ParseTextBlock = {
	[key: string]: {
		'#text': string;
	}[];
};

export const parseTextBlock = (block: ParseTextBlock) => {
	const key = Object.keys(block)[0];
	const target = block[key];
	const value = target[0];

	return value['#text'];
};

export const parseXML = (xml: string) => {
	const parser = new XMLParser({
		ignoreAttributes: false,
		trimValues: false,
		preserveOrder: true,
		isArray: (name, jpath, isLeafNode, isAttribute) => {
			// 배열로 처리하고 싶은 요소들을 지정
			return false;
		},
	});
	const parsedObj = parser.parse(`<root>${xml}</root>`);
	const parsedDataArr = parsedObj[0].root as ParseTextBlock[];
	console.log('🚀 ~ parseXML ~ parsedDataArr:', parsedDataArr);
	return parsedDataArr;
};
