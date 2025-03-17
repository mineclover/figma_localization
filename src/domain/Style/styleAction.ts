import { notify } from '@/figmaPluginUtils';
import { textFontLoad, setAllStyleRanges } from '@/figmaPluginUtils/text';
import { ResourceDTO, ParsedResourceDTO, StyleSync } from '@/model/types';
import { parseXML, parseTextBlock } from '@/utils/xml';

import { DOWNLOAD_STYLE, VARIABLE_PREFIX } from '../constant';
import { getLocalizationKeyData, generateLocalizationName, getTargetTranslations } from '../Label/TextPluginDataModel';
import { getDomainSetting } from '../Setting/SettingModel';
import { clientFetchDBCurry, fetchDB } from '../utils/fetchDB';
import { StyleData } from '@/model/signal';
import { createStyleSegments, groupAllSegmentsByStyle } from './styleModel';
import { generateXmlString } from './StylePage';
import { getFigmaRootStore, safeJsonParse } from '../utils/getStore';
import { applyLocalization, parseLocalizationVariables } from '@/utils/textTools';
import { searchTranslationCode } from '../Translate/TranslateModel';

const innerTextExtract = (text: any): string => {
	if (typeof text === 'string') {
		return text;
	}
	return text[0]['#text'];
};

/**
 * target node 스타일을 로컬라이제이션 키 기준으로 업데이트
 * 요청은 date 값으로 캐싱함
 * @param node
 * @param localizationKey
 * @param date Date.now()
 * @returns
 */
export const TargetNodeStyleUpdate = async (node: TextNode, localizationKey: string, code: string, date: number) => {
	const xNodeId = node.id;
	const domainSetting = getDomainSetting();

	// TODO: 내부에 도메인 설정 없을 때 널처리 시키려고 둔거 같은데 확장성이 낮아진다고 봄
	if (domainSetting == null) {
		notify('Failed to get domain id', 'error');
		return;
	}

	/** 이름이 없어서 이름 얻는 로직 */
	const originTextResult = await getLocalizationKeyData(localizationKey, date);
	if (originTextResult == null) {
		notify('Failed to get localization key data', 'error');
		return;
	}
	node.name = generateLocalizationName(originTextResult);
	const NULL_TEXT = 'NULL TEXT';
	/** 클라에서 받는 로컬라이제이션 키로 번역 값들 조회 */
	const targetText = await searchTranslationCode(localizationKey, code, date);
	if (targetText == null) {
		notify('Failed to get localization data', 'error');
		return;
	}

	// 데이터 처리를 이름 얻기 위해서 로컬 키 얻어서 이름을 얻어오냐
	// 아니면 로컬 키에 소유 번역 키 정보를 같이 담아서 처리 하냐
	// node.name = generateLocalizationName(targetText.text);

	const { variables } = parseLocalizationVariables(targetText.text);
	const variablesKey = Object.values(variables).reduce(
		(acc, item) => {
			const name = item.name.toUpperCase();
			const temp = figma.root.getPluginData(VARIABLE_PREFIX + name) ?? '';
			const changeName = temp === '' ? NULL_TEXT : temp;
			if (temp === '') {
				figma.root.setPluginData(VARIABLE_PREFIX + name, NULL_TEXT);
			}
			acc[item.name] = changeName;
			return acc;
		},
		{} as Record<string, string>
	);

	const fullText = applyLocalization(targetText.text, variablesKey);

	/**
	 * 등록된 번역 값
	 */
	const parsedData = parseXML(fullText ?? '');
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
		const styleValue = safeJsonParse<Record<string, any>>(item.style_value) ?? {};
		resourceMap.set(item.resource_id.toString(), {
			...item,
			style_value: styleValue,
		});
	}

	const parsedText = parsedData
		.map((item) => {
			return parseTextBlock(item);
		})
		.join('');
	try {
		await textFontLoad(node);
		if (parsedText === '') {
			node.characters = fullText;
			return;
		} else {
			node.characters = parsedText;
		}
	} catch (error) {
		if (typeof error === 'string') figma.notify('폰트 로드 실패 :' + error);
	}

	let start = 0;
	let end = 0;

	for (const item of parsedData) {
		const key = Object.keys(item)[0];
		if (key == null) {
			continue;
		}
		// 만약 단일 키일 경우 target 값이 배열이 아니라 문자열로 나온다.
		const targetObject = item[key];
		const value = innerTextExtract(targetObject);

		const length = typeof value === 'string' ? value.length : 0;
		end = start + length;
		let resource = resourceMap.get(key);

		if (key == null || key == '' || key === '#text') {
		} else if (resource == null) {
			const onlineStyle = await fetchDB(('/resources/' + key) as '/resources/{id}', {
				method: 'GET',
			});
			if (onlineStyle == null) {
				notify('Failed to get resource by key', 'error');
				return;
			}
			const onlineData = (await onlineStyle.json()) as ResourceDTO;
			const styleValue = safeJsonParse<Record<string, any>>(onlineData.style_value) ?? {};
			resourceMap.set(key, {
				...onlineData,
				style_value: styleValue,
			});
			resource = resourceMap.get(key);
		}
		const styleValue = resource?.style_value;
		// 문자열만 있을 경우 첫번째 타겟이 문자열로 나온다
		if (typeof targetObject === 'string') {
			// 단일 키일 경우 문자열로 처리
			parsedData.length === 1;
		} else if (styleValue == null) {
			// 스타일 값이 없을 경우 오류 처리
			notify('Failed to get resource by key style_value', 'error');
			return;
		} else {
			await setAllStyleRanges({
				textNode: node,
				xNodeId,
				styleData: styleValue,

				range: {
					start,
					end,
				},
			});
			start = end;
		}
	}
	// 여기서 변수 처리?
};

export const xmlToStyle = async (xml: string, domainId: number | string) => {
	const parsedData = parseXML(xml);
	const clientFetchDB = clientFetchDBCurry(domainId);
	const styleStore: Record<string, StyleSync> = {};

	let start = 0;
	let end = 0;

	for (const item of parsedData) {
		const key = Object.keys(item)[0];
		const value = parseTextBlock(item);

		const length = typeof value === 'string' ? value.length : 0;
		end = start + length;

		const onlineStyle = await clientFetchDB(('/resources/' + key) as '/resources/{id}', {
			method: 'GET',
		});
		const responseResult = (await onlineStyle.json()) as ResourceDTO;
		if (responseResult) {
			const newHashId = responseResult.hash_value;

			const before = styleStore[newHashId];

			const ranges = before?.ranges ?? [];

			const newId = responseResult.resource_id.toString();
			const newAlias = responseResult.alias;
			const newName = responseResult.style_name;
			const newStyle = safeJsonParse<Record<string, any>>(responseResult.style_value) ?? {};
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

// 전역 캐시 객체 추가 - ranges 정보 제외
interface StyleResourceCacheItem {
	name: string;
	id: string;
	alias?: string;
	style: any;
}

export const styleResourceCache: Record<string, StyleResourceCacheItem> = {};

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
		// 캐시 확인 - 이미 같은 해시 ID로 요청한 적이 있는지 확인
		if (styleResourceCache[style.hashId]) {
			// 캐시된 값 사용하되, ranges는 현재 계산된 값 사용
			const cachedData = styleResourceCache[style.hashId];
			styleStore[style.hashId] = {
				hashId: style.hashId,
				name: cachedData.name,
				id: cachedData.id,
				alias: cachedData.alias,
				style: cachedData.style,
				ranges: style.ranges, // 현재 계산된 ranges 사용
			};

			continue;
		}

		// 캐시에 없는 경우 API 요청 실행
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
		const responseResult = (await temp.json()) as ResourceDTO;
		if (responseResult) {
			const newId = responseResult.resource_id.toString();
			const newAlias = responseResult.alias;
			const newName = responseResult.style_name;

			// 결과를 캐시에 저장 (ranges 제외)
			styleResourceCache[style.hashId] = {
				name: newName,
				id: newId,
				alias: newAlias,
				style: style.style,
			};

			// styleStore에는 모든 데이터 포함
			styleStore[style.hashId] = {
				hashId: style.hashId,
				name: newName,
				id: newId,
				alias: newAlias,
				style: style.style,
				ranges: style.ranges,
			};
		}
	}

	const styleStoreArray = Object.values(styleStore);

	const xmlString = generateXmlString(styleStoreArray, mode);

	return { xmlString, styleStoreArray };
};
