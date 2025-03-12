import { notify } from '@/figmaPluginUtils';
import { textFontLoad, setAllStyleRanges } from '@/figmaPluginUtils/text';
import { ResourceDTO, ParsedResourceDTO, StyleSync } from '@/model/types';
import { parseXML, parseTextBlock } from '@/utils/xml';

import { DOWNLOAD_STYLE } from '../constant';
import { getLocalizationKeyData, generateLocalizationName } from '../Label/TextPluginDataModel';
import { getDomainSetting } from '../Setting/SettingModel';
import { clientFetchDBCurry, fetchDB } from '../utils/fetchDB';
import { StyleData } from '@/model/signal';
import { createStyleSegments, groupAllSegmentsByStyle } from './styleModel';
import { generateXmlString } from './StylePage';

/**
 * target node 스타일을 로컬라이제이션 키 기준으로 업데이트
 * 요청은 date 값으로 캐싱함
 * @param node
 * @param localizationKey
 * @param date Date.now()
 * @returns
 */
export const TargetNodeStyleUpdate = async (node: TextNode, localizationKey: string, date: number) => {
	const xNodeId = node.id;
	const domainSetting = getDomainSetting();

	// TODO: 내부에 도메인 설정 없을 때 널처리 시키려고 둔거 같은데 확장성이 낮아진다고 봄
	if (domainSetting == null) {
		notify('Failed to get domain id', 'error');
		return;
	}

	// /** 클라에서 받는 로컬라이제이션 키 없을 때 노드의 원본 텍스트 조회 */
	const originTextResult = await getLocalizationKeyData(localizationKey, date);
	if (originTextResult == null) {
		notify('Failed to get localization key data', 'error');
		return;
	}
	const originText = originTextResult.origin_value;
	node.name = generateLocalizationName(originTextResult);
	// 키 아이디 82
	const parsedData = parseXML(originText ?? '');
	const result2 = await fetchDB(('/resources/by-key/' + localizationKey) as '/resources/by-key/{keyId}', {
		method: 'GET',
	});

	if (result2 == null) {
		notify('Failed to get resource by key', 'error');
		return;
	}

	const data = (await result2.json()) as ResourceDTO[];

	const resourceMap = new Map<string, ParsedResourceDTO>();
	for (const item of data) {
		resourceMap.set(item.resource_id.toString(), {
			...item,
			style_value: JSON.parse(item.style_value),
		});
	}

	const fullText = parsedData
		.map((item) => {
			return parseTextBlock(item);
		})
		.join('');
	try {
		await textFontLoad(node);
		node.characters = fullText;
	} catch (error) {
		if (typeof error === 'string') figma.notify('폰트 로드 실패 :' + error);
	}

	let start = 0;
	let end = 0;

	for (const item of parsedData) {
		const key = Object.keys(item)[0];
		const target = item[key];
		const value = target[0]['#text'] as string;
		const length = typeof value === 'string' ? value.length : 0;
		end = start + length;

		let resource = resourceMap.get(key);

		if (resource == null) {
			const onlineStyle = await fetchDB(('/resources/' + key) as '/resources/{id}', {
				method: 'GET',
			});
			if (onlineStyle == null) {
				notify('Failed to get resource by key', 'error');
				return;
			}
			const onlineData = (await onlineStyle.json()) as ResourceDTO;
			const styleValue = JSON.parse(onlineData.style_value);
			resourceMap.set(key, {
				...onlineData,
				style_value: JSON.parse(styleValue.style_value),
			});
			resource = resourceMap.get(key);
		}
		const styleValue = resource?.style_value;

		if (styleValue == null) {
			notify('Failed to get resource by key', 'error');
			return;
		}
		await setAllStyleRanges({
			textNode: node,
			xNodeId,
			styleData: styleValue,
			boundVariables: {},
			range: {
				start,
				end,
			},
		});
		start = end;
	}
};

export const xmlToStyle = async (xml: string, domainId: number | string) => {
	const parsedData = parseXML(xml);
	const clientFetchDB = clientFetchDBCurry(domainId);
	const styleStore: Record<string, StyleSync> = {};

	let start = 0;
	let end = 0;

	for (const item of parsedData) {
		console.log('🚀 ~ xmlToStyle ~ item:', item);
		const key = Object.keys(item)[0];
		const value = parseTextBlock(item);
		console.log('🚀 ~ xmlToStyle ~ value:', value);
		const length = typeof value === 'string' ? value.length : 0;
		end = start + length;
		console.log('🚀 ~ xmlToStyle ~ end:', start, end);

		const onlineStyle = await clientFetchDB(('/resources/' + key) as '/resources/{id}', {
			method: 'GET',
		});
		const responseResult = (await onlineStyle.json()) as ResourceDTO;
		console.log('🚀 ~ xmlToStyle ~ responseResult:', responseResult);
		if (responseResult) {
			const newHashId = responseResult.hash_value;

			const before = styleStore[newHashId];

			const ranges = before?.ranges ?? [];

			const newId = responseResult.resource_id.toString();
			const newAlias = responseResult.alias;
			const newName = responseResult.style_name;
			const newStyle = JSON.parse(responseResult.style_value);
			const newRanges = {
				start,
				end,
				text: value,
			};

			const store = {
				hashId: newHashId,
				name: newName,
				id: newId,
				alias: newAlias,
				style: newStyle,
				ranges: [...ranges, newRanges],
			};
			styleStore[newHashId] = store;
			start = end;
		}
	}

	return { xmlString: xml, styleStoreArray: Object.values(styleStore) };

	// const onlineStyle = await fetchDB(('/resources/' + key) as '/resources/{id}', {
	// 	method: 'GET',
	// });
};

export const styleToXml = async (
	domainId: number | string,
	characters: string,
	styleData: StyleData,
	mode: 'id' | 'name'
) => {
	console.log('characters 업데이트 시점과 styleData시점이 별개임으로 스플릿이 과도하게 생길 수 있음');

	const clientFetchDB = clientFetchDBCurry(domainId);
	const segments = createStyleSegments(characters, styleData.styleData);
	const boundVariables = createStyleSegments(characters, styleData.boundVariables);
	const allStyleGroups = groupAllSegmentsByStyle(characters, segments, boundVariables);

	const exportStyleGroups = allStyleGroups.exportStyleGroups;
	const styleStore: Record<string, StyleSync> = {};

	for (const style of exportStyleGroups) {
		// store 동시 실행 시 컨텍스트가 이전 컨텍스트여서 오류
		const temp = await clientFetchDB('/resources', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				styleValue: JSON.stringify(style.style),
				hashValue: style.hashId,
			}),
		});
		if (!temp) {
			continue;
		}
		const responseResult = await temp.json();
		if (responseResult) {
			const newId = responseResult.resource_id.toString();
			const newAlias = responseResult.alias;
			const newName = responseResult.style_name;
			const store = {
				hashId: style.hashId,
				name: newName,
				id: newId,
				alias: newAlias,
				style: style.style,
				ranges: style.ranges,
			};
			styleStore[style.hashId] = store;
		}
	}

	const styleStoreArray = Object.values(styleStore);

	const xmlString = generateXmlString(styleStoreArray, mode);

	return { xmlString, styleStoreArray };
};
