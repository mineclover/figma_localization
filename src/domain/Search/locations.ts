import { LocalizationKeyAction, LocalizationTranslationDTO, LocationDTO } from '@/model/types';
import { NODE_STORE_KEY, SET_NODE_LOCATION } from '../constant';
import { getCursorPosition, getNodeData } from '../getState';
import { getDomainSetting } from '../Setting/SettingModel';
import { fetchDB } from '../utils/fetchDB';
import { setNodeData } from '../Label/TextPluginDataModel';
import { notify } from '@/figmaPluginUtils';
import { getAllStyleRanges } from '@/figmaPluginUtils/text';
import { parseXmlToFlatStructure, replaceTagNames, unwrapTag, wrapTextWithTag } from '@/utils/xml2';
import toNumber from 'strnum';
import { styleToXml } from '../Style/styleAction';
import { XmlFlatNode } from '@/utils/types';
import { keyActionFetchCurry } from '../Style/actionFetch';

export const setNodeLocation = async (node: SceneNode) => {
	const domainSetting = getDomainSetting();
	if (!domainSetting) {
		return;
	}

	const currentPointer = getCursorPosition(node);
	if (!currentPointer) {
		return;
	}
	const response = await fetchDB('/figma/locations', {
		method: 'POST',
		body: JSON.stringify({
			projectId: currentPointer.projectId,
			pageId: currentPointer.pageId,
			nodeId: currentPointer.nodeId,
		}),
	});

	if (response.ok) {
		const data = (await response.json()) as LocationDTO;
		const baseNodeId = String(data.location_id);
		setNodeData(node, {
			baseNodeId: baseNodeId,
		});
		return data;
	}

	return;
};

export const idSetLocation = async (nodeId: string) => {
	const node = await figma.getNodeByIdAsync(nodeId);
	if (!node) {
		return;
	}

	return setNodeLocation(node as SceneNode);
};

// ---------------------------- 변환 파이프라인  ------------------------------
/** 파싱 */
export const xmlParse = async (xmlString: string) => {
	const flatItems = await parseXmlToFlatStructure(xmlString);
	return flatItems;
};

export const targetKeyParse = (flatItems: XmlFlatNode[]) => {
	const targetKey = flatItems.filter((item) => item.tagName !== 'br');

	return new Set(targetKey.map((item) => item.tagName));
};

/**
 * 키 이름 변경 맵 받아서 변환
 * @param flatItems
 * @returns
 */
export const diff = (list: Awaited<ReturnType<typeof targetKeyParse>>, data: LocalizationKeyAction[]) => {
	const keyMap: Record<string, string> = {};

	// 쓰기 좋게 키 이름으로 빈 문자열 만들고
	for (const item of list) {
		if (item !== '') {
			keyMap[item] = '';
		}
	}
	const output = data.reduce((acc, item, index) => {
		const effectKey = item.effect_resource_id;
		const styleKey = item.style_resource_id;
		const normalKey = [effectKey, styleKey].join(':');
		acc[normalKey] = item.from_enum;
		return acc;
	}, keyMap);

	return output;
};

const changeXml = async (text: string, tags: Record<string, string>) => {
	const brString = text.replace(/\n/g, '<br/>');
	let result = brString;

	for (const [key, value] of Object.entries(tags)) {
		if (value !== '') {
			result = await replaceTagNames(result, key, value);
		}
	}
	const result1 = await unwrapTag(result);
	const result2 = await wrapTextWithTag(result1);

	console.log('🚀 ~ 무결성 검사 : ', result === result2);
	const brString2 = result1.replace(/\n/g, '<br/>');

	return brString2;
};

export const addTranslationV2 = async (node: TextNode) => {
	const nodeData = getNodeData(node);

	const localizationKey = nodeData.localizationKey;

	if (localizationKey === '' || nodeData.domainId == null) {
		notify('335 Failed to get localization key', 'error');
		return;
	}

	const styleData = getAllStyleRanges(node);
	const { xmlString, styleStoreArray, effectStyle } = await styleToXml(
		toNumber(nodeData.domainId),
		node.characters,
		styleData,
		'id'
	);

	const fn1 = await xmlParse(xmlString);
	const fn2 = targetKeyParse(fn1);
	const fn3 = keyActionFetchCurry(localizationKey, 'default');
	const fn31 = await fn3();
	const tags = diff(fn2, fn31);
	console.log('🚀 ~ addTranslationV2 ~ fn4:', tags);

	const brString = await changeXml(xmlString, tags);
	console.log('🚀 ~ addTranslationV2 ~ brString:', brString);

	// 대부분의 시스템에서 \n는 공백으로 처리되기 때문에 시각적으로 보이지 않음
	// 따라서 시각적으로 보이게 하기 위해 br로 처리하는게 합리적이게 보임
	// 피그마에서 공백은 \n이 아닌 다른 값임 찾아서 넣어야할 수 있음

	// 저장할 때부터 a 먹여서 넣어야하니까 여기부터 하면 됨
	try {
		const translations = await fetchDB('/localization/translations', {
			method: 'PUT',
			body: JSON.stringify({
				keyId: nodeData.localizationKey,
				language: 'origin',
				translation: brString,
			}),
		});
		if (!translations) {
			return;
		}
		if (translations.status === 200) {
			const data = (await translations.json()) as LocalizationTranslationDTO;
			node.setPluginData(NODE_STORE_KEY.ORIGINAL_LOCALIZE_ID, data.localization_id.toString());

			return data;
		} else {
			const data = await translations.json();

			// 잘못 등록된  경우도 에러임
			if (data.message.details === 'SQLITE_CONSTRAINT: FOREIGN KEY constraint failed') {
				notify('로컬라이제이션 키를 찾을 수 없음', 'error');
			} else {
				notify('오리진 값이 등록되지 않았을 확률이 큼', 'error');
			}
		}
	} catch (error) {}

	console.log('🚀 ~ addTranslationV2 ~ styleStoreArray:', styleStoreArray);
	// for (const style of styleStoreArray) {
	// 	// 매핑 로직이 변경 됨
	// 	// key , action,type
	// 	const result = await fetchDB('/localization/actions', {
	// 		method: 'POST',
	// 		body: JSON.stringify({
	// 			keyId: nodeData.localizationKey,
	// 			action: 'default',
	// 			fromEnum: 'a', // Changed to string since from_enum is TEXT type
	// 			styleResourceId: style.id,
	// 			effectResourceId: style.id,
	// 		}),
	// 	});
	// 	if (!result) {
	// 		notify('Failed to set resource mapping ' + style.id, 'error');
	// 		continue;
	// 	}
	// }
};
