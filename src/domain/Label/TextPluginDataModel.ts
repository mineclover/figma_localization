import { NodeData } from '@/model/types';
import { emit, on } from '@create-figma-plugin/utilities';
import {
	GET_CURSOR_POSITION,
	GET_LOCALIZATION_KEY_VALUE,
	NODE_STORE_KEY,
	PUT_LOCALIZATION_KEY,
	RELOAD_NODE,
	SET_NODE_LOCATION,
	SET_NODE_RESET_KEY,
	UPDATE_NODE_STORE_KEY,
} from '../constant';
import toNumber from 'strnum';

import { notify } from '@/figmaPluginUtils';
import { getCursorPosition } from './LabelModel';
import { fetchDB } from '../utils/fetchDB';
import { getDomainSetting } from '../Setting/SettingModel';
import { getAllStyleRanges, textFontLoad } from '@/figmaPluginUtils/text';
import { components } from 'types/i18n';
import { createStyleSegments, groupAllSegmentsByStyle } from '../Style/styleModel';

import { generateXmlString } from '../Style/StylePage';
import { StyleSync } from '@/model/types';

import {
	LocationDTO,
	Location,
	LocalizationKey,
	LocalizationKeyDTO,
	LocalizationKeyProps,
	LocalizationTranslation,
	LocalizationTranslationDTO,
} from '@/model/types';
import { styleToXml, TargetNodeStyleUpdate } from '../Style/styleAction';

export const locationMapping = (location: LocationDTO): Location => {
	return {
		location_id: location.location_id,
		project_id: location.project_id,
		node_id: location.node_id,
		page_id: location.page_id,
		is_pinned: location.is_pinned === 1,
		is_deleted: location.is_deleted === 1,
		created_at: location.created_at,
		updated_at: location.updated_at,
	};
};

export const localizationKeyMapping = (dto: LocalizationKeyDTO): LocalizationKey => {
	return {
		key_id: dto.key_id,
		domain_id: dto.domain_id,
		name: dto.name,
		alias: dto.alias,
		parent_key_id: dto.parent_key_id,
		is_variable: dto.is_variable === 1,
		is_temporary: dto.is_temporary === 1,
		section_id: dto.section_id,
		section_name: dto.section_name,
		version: dto.version,
		is_deleted: dto.is_deleted === 1,
		created_at: dto.created_at,
		updated_at: dto.updated_at,
	};
};

/** 노드에서 키에 소속된 모든 번역 값 조회 */
export const getNodeTranslations = async (node: BaseNode) => {
	const nodeData = getNodeData(node);
	if (nodeData.localizationKey === '') {
		return;
	}
	return await getTargetTranslations(nodeData.localizationKey);
};

/**
 * 키에 번역된 언어 검색 , 작업 중
 * 리스트로 보내야 함
 */
export const onGetKeyTranslations = () => {
	on(GET_LOCALIZATION_KEY_VALUE.REQUEST_KEY, async () => {
		const node = figma.currentPage.selection[0];
		if (!node || node.type !== 'TEXT') {
			return;
		}

		const result = await getNodeTranslations(node);
	});
};

/** 낙관적 업데이트로 반영 */
export const onSetNodeResetKey = () => {
	on(SET_NODE_RESET_KEY.REQUEST_KEY, async () => {
		const node = figma.currentPage.selection[0];
		if (!node || node.type !== 'TEXT') {
			return;
		}

		node.setPluginData(NODE_STORE_KEY.DOMAIN_ID, '');
		node.setPluginData(NODE_STORE_KEY.LOCALIZATION_KEY, '');
		node.setPluginData(NODE_STORE_KEY.ORIGINAL_LOCALIZE_ID, '');
		node.setPluginData(NODE_STORE_KEY.LOCATION, '');
		node.autoRename = true;
	});
};

export const localizationTranslationMapping = (dto: LocalizationTranslationDTO): LocalizationTranslation => {
	return {
		created_at: dto.created_at,
		is_deleted: dto.is_deleted === 1,
		key_id: dto.key_id,
		language_code: dto.language_code,
		last_modified_by: dto.last_modified_by,
		localization_id: dto.localization_id,
		text: dto.text,
		updated_at: dto.updated_at,
		version: dto.version,
	};
};

export const generateLocalizationName = (keyData: LocalizationKeyDTO) => {
	console.log('🚀 ~ generateLocalizationName ~ keyData:', keyData);
	/** 임시 값이면 @ 붙이고 아니면 # 붙임 */
	const prefix = keyData.is_temporary ? '❎' : '✅';
	const name = prefix + keyData.name;

	return name;
};

// 캐시 시스템 구현
interface CacheItem<T> {
	timestamp: number;
	data: T;
}

const requestCache = new Map<string, CacheItem<any>>();

/**
 * 로컬라이제이션 키를 기준으로 이름 리로드
 */
export const getLocalizationKeyData = async (
	localizationKey: string,
	now: number
): Promise<LocalizationKeyDTO | null> => {
	if (localizationKey === '') {
		return null;
	}

	const apiPath = '/localization/keys/id/' + localizationKey;
	const cacheKey = apiPath;

	const cachedItem = requestCache.get(cacheKey);

	// 캐시된 항목이 있고, 캐시 기간이 지나지 않았으면 캐시된 데이터 반환 (0.5초)

	if (cachedItem && now - (cachedItem?.timestamp ?? 0) < 3000) {
		console.log(`캐시된 데이터 반환: ${cacheKey}`);
		return cachedItem.data;
	}

	// 캐시가 없거나 만료된 경우 새로운 요청 수행
	const result = await fetchDB(apiPath as '/localization/keys/id/{id}', {
		method: 'GET',
	});

	if (!result || result.status === 500) {
		return null;
	}
	const data = (await result.json()) as LocalizationKeyDTO;

	if (result.status === 200) {
		// 결과 캐싱
		requestCache.set(cacheKey, {
			timestamp: now,
			data: data,
		});
		console.log('캐싱 갱신 됨');
		return data;
	}
	return null;
};

/** 번역 키 기반 단일 값 조회 */
export const getTargetLocalizationName = async (id: string) => {
	const result = await fetchDB(('/localization/translations/id/' + id) as '/localization/translations/id/{id}', {
		method: 'GET',
	});

	if (!result) {
		return;
	}

	const data = (await result.json()) as LocalizationTranslationDTO;
	return data.text;
};

/** 번역에 대해 수정하거나 업데이트하거나 */
export const putTargetTranslations = async (id: string, language: string, text: string) => {
	const result = await fetchDB('/localization/translations', {
		method: 'PUT',
		body: JSON.stringify({
			keyId: id,
			language: language,
			translation: text,
		}),
	});

	if (!result) {
		return;
	}

	const data = (await result.json()) as LocalizationTranslationDTO;

	return data;
};

/** 하나만 얻음 */
export const searchTargetLocalization = async (id: string, language: string) => {
	const result = await fetchDB('/localization/translations/search', {
		method: 'POST',
		body: JSON.stringify({
			keyId: id,
			language: language,
		}),
	});

	if (!result) {
		return;
	}

	const data = (await result.json()) as LocalizationTranslationDTO;

	return data.text;
};
/** 키 아이디 기반으로 여러개 얻음 */
export const getTargetTranslations = async (id: string) => {
	const result = await fetchDB(
		('/localization/keys/' + id + '/translations') as '/localization/keys/{id}/translations',
		{
			method: 'GET',
		}
	);

	if (!result) {
		return;
	}

	const data = (await result.json()) as LocalizationTranslationDTO[];

	return data;
};

/**
 * 오리지널 로컬라이제이션 키를 기준으로 값 일괄 수정
 * TODO: 문제 있는 걸로 보임
 * allRefresh
 */
export const reloadOriginalLocalizationName = async (node: BaseNode) => {
	const nodeData = getNodeData(node);
	if (nodeData.localizationKey === '') {
		return;
	}
	const localizationKey = nodeData.localizationKey;
	figma.skipInvisibleInstanceChildren = true;

	const arr = figma.currentPage.findAllWithCriteria({
		types: ['TEXT'],
		pluginData: {
			keys: [NODE_STORE_KEY.LOCALIZATION_KEY],
		},
	});

	const targetOrigin = new Map<string, Set<TextNode>>();

	//  map 말고 foreach 해도 될지도?
	/**
	 * 현재 로컬라이제이션 키가 같은 노드들을 모아서 처리
	 */
	const targetTextArr = arr

		.filter((item) => {
			const currentLocalizationKey = item.getPluginData(NODE_STORE_KEY.LOCALIZATION_KEY);
			if (localizationKey === currentLocalizationKey) {
				return true;
			}
			return false;
		})
		.map((node) => {
			const nodeData = getNodeData(node);
			if (nodeData.originalLocalizeId != null && nodeData.originalLocalizeId !== '') {
				let temp = targetOrigin.get(nodeData.originalLocalizeId);
				if (temp == null) {
					temp = new Set<TextNode>();
				}

				targetOrigin.set(nodeData.originalLocalizeId, temp.add(node));
			}
			return {
				node: node,
				data: nodeData,
			};
		});

	const now = Date.now();
	for (const [key, targetNodes] of targetOrigin.entries()) {
		for (const node of targetNodes) {
			await TargetNodeStyleUpdate(node, localizationKey, 'origin', now);
		}
	}
};

export const addTranslation = async (node: TextNode) => {
	const nodeData = getNodeData(node);

	if (nodeData.localizationKey === '' || nodeData.domainId == null) {
		notify('Failed to get localization key', 'error');
		return;
	}

	const styleData = getAllStyleRanges(node);
	const { xmlString, styleStoreArray } = await styleToXml(
		toNumber(nodeData.domainId),
		node.characters,
		styleData,
		'id'
	);

	const result = await fetchDB('/localization/translations', {
		method: 'PUT',
		body: JSON.stringify(
			{
				keyId: nodeData.localizationKey,
				language: 'origin',
				translation: xmlString,
			},
			null,
			2
		),
	});
	if (!result) {
		return;
	}

	for (const style of styleStoreArray) {
		const result = await fetchDB('/resources/mapping', {
			method: 'POST',
			body: JSON.stringify({
				resourceId: style.id,
				keyId: nodeData.localizationKey,
			}),
		});
		if (!result) {
			notify('Failed to set resource mapping ' + style.id, 'error');
			continue;
		}
	}

	const data = (await result.json()) as LocalizationTranslationDTO;
	console.log('🚀 ~ addTranslation ~ data:', data);

	if (result.status === 200) {
		node.setPluginData(NODE_STORE_KEY.ORIGINAL_LOCALIZE_ID, data.localization_id.toString());
		const nodeData = getNodeData(node);
		console.log('🚀 ~ addTranslation ~ nodeData:', nodeData);

		return data;
	} else {
		notify('Failed to set location', 'error');
	}
};

/**
 * 일반 localization key 생성
 */
export const createNormalLocalizationKey = async (
	node: BaseNode,
	{ domainId, alias, name, sectionId, sectionName }: LocalizationKeyProps
) => {
	const temp = {
		domainId: domainId,
		name: name,
		isTemporary: true,
		sectionId: sectionId,
	} as LocalizationKeyProps;
	// 섹션이 비지 않았고, 섹션이 같으면

	if (alias) {
		temp.alias = alias;
	}

	// targetData
	const result = await fetchDB('/localization/keys', {
		method: 'POST',
		body: JSON.stringify(temp, null, 2),
	});

	if (!result) {
		return;
	}

	const data = (await result.json()) as LocalizationKeyDTO;

	if (result.status === 200) {
		node.setPluginData(NODE_STORE_KEY.DOMAIN_ID, data.domain_id.toString());
		node.setPluginData(NODE_STORE_KEY.LOCALIZATION_KEY, data.key_id.toString());
		return data;
	} else {
		notify('Failed to set localization key', 'error');
	}
};

/** 1. 노드 데이터 설정 */
export const setNodeData = (node: BaseNode, data: Partial<NodeData>) => {
	if (data.domainId != null) {
		node.setPluginData(NODE_STORE_KEY.DOMAIN_ID, data.domainId.toString());
	}

	if (data.localizationKey != null) {
		node.setPluginData(NODE_STORE_KEY.LOCALIZATION_KEY, data.localizationKey.toString());
	}

	if (data.originalLocalizeId != null) {
		node.setPluginData(NODE_STORE_KEY.ORIGINAL_LOCALIZE_ID, data.originalLocalizeId.toString());
	}

	if (data.ignore != null) {
		node.setPluginData(NODE_STORE_KEY.IGNORE, data.ignore.toString());
	}
};

/**
 * 로컬라이제이션 텍스트 등록 과정
 * 플러그인 데이터 생성 */
export const onTargetSetNodeLocation = () => {
	on(SET_NODE_LOCATION.REQUEST_KEY, async () => {
		const node = figma.currentPage.selection[0];
		if (node.type !== 'TEXT') {
			return;
		}
		const result = await getCursorPosition(node);

		if (!result) {
			return;
			// 실행 될리가 없는 곳이긴 함
		}
		/**
		 * result는 이전 값을 가지고 있음 init해도 안바뀜
		 * 새 값이 고정된 영역에 고정되있음
		 * */

		// 임시 키 값 설정
		// 변경 가능하고 저장 가능하게 임시 값 보여야 함
		// 섹션 관리 되야 함

		const domainSetting = getDomainSetting();

		if (!domainSetting) {
			return;
		}

		// section은 [sectionName] {기존 제목} 으로 처리 됨

		const newKey = await createNormalLocalizationKey(node, {
			domainId: domainSetting.domainId,
			name: result.nodeName,
		});
		if (!newKey) {
			return;
		}

		const originTextResult = await getLocalizationKeyData(newKey.key_id.toString(), Date.now());
		if (originTextResult == null) {
			return;
		}
		node.name = generateLocalizationName(originTextResult);

		// 두번 눌렀을 때 처리 어떻게 할지 정해야 됨
		await addTranslation(node);

		/** 업데이트 반영 코드 */
		await allRefresh(node);
	});
};

export const allRefresh = async (node: TextNode) => {
	// getCursorPosition은 LabelModel.ts에서 가져와 사용
	const cursorPosition = await getCursorPosition(node);
	emit(GET_CURSOR_POSITION.RESPONSE_KEY, cursorPosition);

	// 이 함수는 이 파일에 있으므로 직접 호출
	const value = await processTextNodeLocalization(node);
	emit(GET_LOCALIZATION_KEY_VALUE.RESPONSE_KEY, value);
};

/**
 * allRefresh
 */
export const onNodeReload = () => {
	on(RELOAD_NODE.REQUEST_KEY, async () => {
		const node = figma.currentPage.selection[0];
		if (!node || node.type !== 'TEXT') {
			return;
		}

		figma.commitUndo();

		await reloadOriginalLocalizationName(node);
	});
};

/** 플러그인 데이터 조회 */
export const getNodeData = (node: BaseNode): NodeData => {
	const localizationKey = node.getPluginData(NODE_STORE_KEY.LOCALIZATION_KEY);
	const originalLocalizeId = node.getPluginData(NODE_STORE_KEY.ORIGINAL_LOCALIZE_ID);
	const domainId = node.getPluginData(NODE_STORE_KEY.DOMAIN_ID);
	const ignore = node.getPluginData(NODE_STORE_KEY.IGNORE) === 'true';

	return {
		localizationKey,
		originalLocalizeId,
		domainId: domainId || '',
		ignore: ignore || false,
	};
};

/**
 * TEXT 타입 노드의 지역화 키에 대한 데이터를 처리합니다.
 * @param node 처리할 노드
 * @returns 지역화된 값 또는 undefined
 */
export const processTextNodeLocalization = async (node: SceneNode) => {
	if (!node || node.type !== 'TEXT') {
		return;
	}

	const nodeData = getNodeData(node);
	if (nodeData.localizationKey === '') {
		return;
	}

	const result = await getLocalizationKeyData(nodeData.localizationKey, Date.now());
	if (!result) {
		return;
	}

	return localizationKeyMapping(result);
};

export type PutLocalizationKeyType = components['schemas']['UpdateLocalizationKeyDTO'];

export const onPutLocalizationKey = () => {
	on(PUT_LOCALIZATION_KEY.REQUEST_KEY, async (localizationKey: string, data: PutLocalizationKeyType) => {
		const result = await putLocalizationKey(localizationKey, data);

		if (!result) {
			return;
		}

		if (typeof result === 'string') {
			notify(result, 'error');
			return;
		}

		// emit(PUT_LOCALIZATION_KEY.RESPONSE_KEY, result)
	});
};

export const putLocalizationKey = async (localizationKey: string, body: PutLocalizationKeyType) => {
	const result = await fetchDB(('/localization/keys/' + localizationKey) as '/localization/keys/{id}', {
		method: 'PUT',
		body: JSON.stringify(body, null, 2),
	});

	if (!result) {
		return;
	}

	const data = (await result.json()) as LocalizationKeyDTO | string;

	return data;
};

export const onUpdateNodeStoreBatchKey = () => {
	on(UPDATE_NODE_STORE_KEY.REQUEST_KEY, async (key: number) => {
		const node = figma.currentPage.selection[0];
		if (!node || node.type !== 'TEXT') {
			return;
		}

		const domainSetting = getDomainSetting();
		if (!domainSetting) {
			return;
		}

		node.setPluginData(NODE_STORE_KEY.DOMAIN_ID, domainSetting.domainId.toString());

		node.setPluginData(NODE_STORE_KEY.LOCALIZATION_KEY, key.toString());

		const translations = await getTargetTranslations(key.toString());
		if (!translations || translations.length === 0) {
			return;
		}

		const translation = translations[0];
		if (!translation) {
			return;
		}
		node.setPluginData(NODE_STORE_KEY.ORIGINAL_LOCALIZE_ID, translation.localization_id.toString());
		await allRefresh(node);
		figma.commitUndo();

		await reloadOriginalLocalizationName(node);
	});
};
