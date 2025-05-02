import { LocalizationKeyAction, LocalizationTranslationDTO, LocationDTO } from '@/model/types';
import { NODE_STORE_KEY, SET_NODE_LOCATION, TRANSLATION_ACTION_PAIR } from '../constant';
import { getCursorPosition, getExtendNodeData, getNodeData } from '../getState';
import { getDomainSetting } from '../Setting/SettingModel';
import { fetchDB } from '../utils/fetchDB';
import { putLocalizationKey, PutLocalizationKeyType, setNodeData } from '../Label/TextPluginDataModel';
import { notify } from '@/figmaPluginUtils';
import { getAllStyleRanges } from '@/figmaPluginUtils/text';
import { parseXmlToFlatStructure, replaceTagNames, unwrapTag, wrapTextWithTag } from '@/utils/xml2';
import toNumber from 'strnum';
import { styleToXml } from '../Style/styleAction';
import { XmlFlatNode } from '@/utils/types';
import { keyActionFetchCurry } from '../Style/actionFetch';
import { emit, on } from '@create-figma-plugin/utilities';
import { ActionType } from '../System/ActionResourceDTO';
import { getFrameNodeMetaData, searchStore } from './searchStore';
import { postClientLocation, overlayRender } from './visualModel';
import { getPageId, getProjectId } from '../Label/LabelModel';
import { PageSelectIdsToBoxHandler } from '@/figmaPluginUtils/types';
import { KeyIdNameSignal } from '@/model/signal';

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

export type TranslationInputType = {
	localizationKey: string;
	baseNodeId: string;
	action: ActionType;
	prefix: string;
	name: string;
	// ids: string[]; // or nodeId 베이스 선택용
	sectionId: number;
	targetNodeId: string;
};

/**
 *
 * @param index 26 이상 넘어가면 안됨
 * @returns
 */
function getLetterByIndex(index: number) {
	if (index < 0 || index >= 26) {
		throw new Error('Index out of range');
	}

	const alphabet = 'abcdefghijklmnopqrstuvwxyz';

	return alphabet[index];
}

export const addTranslationV2 = async (node: TextNode, localizationKey: string, action: ActionType) => {
	// me
	const nodeData = getNodeData(node);

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

	const tags = Array.from(fn2).reduce(
		(acc, item, index) => {
			const letter = getLetterByIndex(index);
			acc[item] = letter;
			return acc;
		},
		{} as Record<string, string>
	);

	const brString = await changeXml(xmlString, tags);

	// 대부분의 시스템에서 \n는 공백으로 처리되기 때문에 시각적으로 보이지 않음
	// 따라서 시각적으로 보이게 하기 위해 br로 처리하는게 합리적이게 보임
	// 피그마에서 공백은 \n이 아닌 다른 값임 찾아서 넣어야할 수 있음

	// 저장할 때부터 a 먹여서 넣어야하니까 여기부터 하면 됨
	try {
		const translations = await fetchDB('/localization/translations', {
			method: 'PUT',
			body: JSON.stringify({
				keyId: localizationKey,
				language: 'origin',
				translation: brString,
			}),
		});
		if (!translations) {
			return;
		}
		if (translations.status === 200) {
			const data = (await translations.json()) as LocalizationTranslationDTO;
			console.log('🚀 ~ addTranslationV2 ~ data:', data);
			node.setPluginData(NODE_STORE_KEY.ORIGINAL_LOCALIZE_ID, data.localization_id.toString());
		} else {
			// response에서 값 읽어서 안전하게 뽑는 것을 고려할만 함
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

	// 액션 = 키 매핑
	for (const [key, value] of Object.entries(tags)) {
		const [styleResourceId, effectResourceId] = key.split(':');
		// 매핑 로직이 변경 됨
		// key , action,type
		const result = await fetchDB('/localization/actions', {
			method: 'POST',
			body: JSON.stringify({
				keyId: localizationKey,
				action: action,
				fromEnum: value, // Changed to string since from_enum is TEXT type
				styleResourceId,
				effectResourceId,
			}),
		});
		if (!result) {
			notify('Failed to set localization - actions mapping ' + key, 'error');
			continue;
		}
		if (result) {
			const data = await result.json();
			console.log('🚀 ~ addTranslationV2 ~ data:', data);
		}
	}
};

export const onTranslationActionRequest = () => {
	on(TRANSLATION_ACTION_PAIR.REQUEST_KEY, async (data: TranslationInputType) => {
		const { localizationKey, baseNodeId, action, prefix, name, targetNodeId, sectionId } = data;
		console.log(`🚀 ~ on ~  { localizationKey, baseNodeId, action, prefix, name, nodeId, sectionId }:`, {
			localizationKey,
			baseNodeId,
			action,
			prefix,
			name,
			targetNodeId,
			sectionId,
		});
		// 1. 베이스 아이디의 기준 location 이 변경 될 수 있다
		// 2. 일단 키 등록 된 상태로 오지만 origin은 등록되지 않았다
		// 3. 이름 변경되서 올 수 있다

		const nodeInfo = searchStore.baseLocationStore;
		const location = nodeInfo.get(baseNodeId);
		if (!location) {
			notify('location id를 찾을 수 없음', 'error');

			return;
		}

		const { node_id: location_node_id } = location;

		const idsNode = figma.currentPage.selection;
		const idsNodeData = idsNode.map((item) => getFrameNodeMetaData(item as FrameNode));

		const baseNodeData = idsNodeData.find((item) => item?.id === location_node_id);

		if (!baseNodeData) {
			notify('베이스 아이디를 찾을 수 없음', 'error');

			return;
		}

		// const
		const domainSetting = getDomainSetting();
		const projectId = getProjectId();
		const pageId = getPageId();
		if (!projectId || !pageId || !domainSetting) {
			notify('프로젝트 아이디 또는 페이지 아이디를 찾을 수 없음', 'error');

			return;
		}
		console.log('🚀 ~ on ~ baseNodeId, { nodeId, pageId, projectId }:', baseNodeId, {
			targetNodeId,
			pageId,
			projectId,
		});

		// 로케이션 베이스 아이디 업데이트 > 변경 요청
		if (targetNodeId && targetNodeId !== '') {
			console.log('🚀 ~ on ~ targetNodeId:', targetNodeId);
			await searchStore.updateBaseNode(baseNodeId, { nodeId: targetNodeId, pageId, projectId });
		}

		// overlayRender();

		const reg = new RegExp(`^${prefix}`, 'g');

		const nextName = prefix + '_' + name.replace(reg, '');

		const putLocalizationData: PutLocalizationKeyType = {
			name: nextName,
			alias: nextName,
			sectionId: sectionId,
			domainId: domainSetting.domainId,
		};
		const result1 = await putLocalizationKey(localizationKey, putLocalizationData);
		// 등록 실패하면 어떻게 반환할건지 정해야 함
		console.log('🚀 ~ on ~ result1:', result1);
		if (!result1?.success) {
			notify(result1?.message ?? '로컬라이제이션 키 등록 실패', 'error');
			return;
		} else {
			notify(result1?.message ?? '로컬라이제이션 키 등록 성공', 'ok');
			// kv 업데이트 해줘야 됨
			updateLocalizationName(localizationKey, putLocalizationData);
		}

		const baseNode = await figma.getNodeByIdAsync(baseNodeData.id);
		if (!baseNode) {
			notify('베이스 아이디를 찾을 수 없음', 'error');

			return;
		}
		const result2 = await addTranslationV2(baseNode as TextNode, localizationKey, action);
		console.log('🚀 ~ on ~ result2:', result2);

		const result = await fetchDB('/figma/location-actions', {
			method: 'POST',
			body: JSON.stringify({
				keyId: localizationKey,
				action: action,
				locationId: baseNodeId,
				fromEnum: 'a',
			}),
		});
		if (!result) {
			notify('Failed to set location - actions mapping ' + baseNodeId, 'error');
		}
		if (result) {
			const data = await result.json();
			console.log('🚀 ~ on ~ data:', data);
		}

		postClientLocation();
		// aasdf
	});
};

/** 특정 값으로 노드 줌 */
export const onTextToFrameSelect = () => {
	on<PageSelectIdsToBoxHandler>('PAGE_SELECT_IDS_TO_BOX', async ({ ids, select }) => {
		// console.log('🚀 ~ pageSelectIds_Adapter ~ ids:', ids);

		const nodes = ids
			.map((id) => {
				const node = searchStore.getTextToFrame(id);
				return node;
			})
			.filter((item) => item != null);
		// const nodes = figma.currentPage.findAll((node) => ids.includes(node.id));

		if (nodes) {
			// 노드로 화면 줌
			if (select) {
				figma.currentPage.selection = nodes;
			}
			figma.viewport.scrollAndZoomIntoView(nodes);
		}
	});
};

export const updateLocalizationName = (localizationKey: string, putLocalizationData: PutLocalizationKeyType) => {
	emit(TRANSLATION_ACTION_PAIR.RESPONSE_KEY, {
		localizationKey,
		...putLocalizationData,
	} as { localizationKey: string } & PutLocalizationKeyType);
};

export const onTranslationActionResponse = () => {
	return on(
		TRANSLATION_ACTION_PAIR.RESPONSE_KEY,
		async (data: { localizationKey: string } & PutLocalizationKeyType) => {
			console.log('🚀 ~ onTranslationActionResponse ~ data:', data);
			const { localizationKey, name, alias, sectionId, domainId } = data;

			if (name === '' || name == null) {
				return;
			}

			const oldValue = KeyIdNameSignal.value;
			console.log('🚀 ~ on ~ oldValue:', oldValue);
			KeyIdNameSignal.value = {
				...oldValue,
				[localizationKey]: name,
			};
		}
	);
};
