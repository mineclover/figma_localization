import { emit, on } from '@create-figma-plugin/utilities';
import {
	SET_DOMAIN_PAIR,
	GET_DOMAIN_PAIR,
	STORE_KEY,
	GET_LANGUAGE_CODES,
	SET_LANGUAGE_CODES,
	CHANGE_LANGUAGE_CODE,
	CURRENT_SECTION_SELECTED,
	NODE_STORE_KEY,
	GET_VARIABLE_DATA,
	VARIABLE_PREFIX,
	SET_VARIABLE_DATA,
	CLEAR_VARIABLE_DATA,
} from '../constant';
import { getFigmaRootStore, setFigmaRootStore } from '../utils/getStore';
import { getNodeData } from '../Label/TextPluginDataModel';
import { CurrentNode, LocalizationTranslationDTO } from '@/model/types';
import { fetchDB } from '../utils/fetchDB';
import { textFontLoad } from '@/figmaPluginUtils/text';
import { FilePathNodeSearch } from '@/figmaPluginUtils';
import { currentSectionSignal, variableDataSignal } from '@/model/signal';
import { TargetNodeStyleUpdate } from '../Style/styleAction';

export const onCurrentSectionSelectedResponse = () => {
	emit(CURRENT_SECTION_SELECTED.REQUEST_KEY);
	return on(CURRENT_SECTION_SELECTED.RESPONSE_KEY, (section: CurrentNode) => {
		currentSectionSignal.value = section;
	});
};

/**
 * 선택 기능으로 선택을 제어하려 할 때는 트리거 온오프로 상태 업데이트를 제어하는 방식으로 구성
 * @param node
 * @returns
 */
export const getCurrentSectionSelected = (node: BaseNode) => {
	if (node && node.type === 'SECTION') {
		return {
			id: node.id,
			name: node.name,
		};
	}

	if (node) {
		const result = FilePathNodeSearch(node);
		const sectionNode = result.find((node) => node.type === 'SECTION');

		if (sectionNode) {
			return {
				id: sectionNode.id,
				name: sectionNode.name,
			};
		}
	}

	return null;
};
export const onCurrentSectionSelected = () => {
	on(CURRENT_SECTION_SELECTED.REQUEST_KEY, () => {
		const section = getCurrentSectionSelected(figma.currentPage.selection[0]);
		if (section) {
			emit(CURRENT_SECTION_SELECTED.RESPONSE_KEY, section);
		}
	});
};

export const searchTranslationCode = async (key: string, code: string) => {
	const result = await fetchDB(
		('/localization/translations/search?keyId=' + key + '&language=' + code) as '/localization/translations/search',
		{
			method: 'GET',
		}
	);

	if (!result || result.status !== 200) {
		return;
	}

	const data = (await result.json()) as LocalizationTranslationDTO;

	return data;
};

/** 영역 내에 있는 모든 텍스트 노드의 로컬라이제이션 키를 찾아서 변경 */
export const changeLocalizationCode = async (sectionNode: SectionNode | PageNode, code: string) => {
	//인스턴스도 탐색해서 수정하기 위함
	figma.skipInvisibleInstanceChildren = false;

	const arr = sectionNode.findAllWithCriteria({
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
			if (currentLocalizationKey) {
				return true;
			}
			return false;
		})
		.map((item) => {
			const localizationKey = item.getPluginData(NODE_STORE_KEY.LOCALIZATION_KEY);

			if (localizationKey !== '') {
				let temp = targetOrigin.get(localizationKey);
				if (temp == null) {
					temp = new Set<TextNode>();
				}

				targetOrigin.set(localizationKey, temp.add(item));
			}
			return item;
		});

	const now = Date.now();
	for (const [key, targetNodes] of targetOrigin.entries()) {
		// key , code

		const a = await searchTranslationCode(key, code);

		if (a) {
			for (const node of targetNodes) {
				const localizationKey = node.getPluginData(NODE_STORE_KEY.LOCALIZATION_KEY);

				if (localizationKey) {
					await TargetNodeStyleUpdate(node, localizationKey, code, now);
				}
			}
		}
	}
};

/** 번역을 위한 언어 코드 설정 */
export const onSetLanguageCode = async () => {
	on(CHANGE_LANGUAGE_CODE.REQUEST_KEY, async (languageCode: string, sectionId?: string) => {
		let areaNode: SectionNode | PageNode | null = null;
		if (sectionId) {
			areaNode = (await figma.getNodeByIdAsync(sectionId)) as SectionNode | null;
		} else {
			areaNode = figma.currentPage;
		}
		if (areaNode == null) {
			return;
		}
		await changeLocalizationCode(areaNode, languageCode);
		getVariableData();
	});
};

/** 변수 데이터 조회 후 전송 */
export const getVariableData = () => {
	const data = figma.root.getPluginDataKeys();
	const variableData = data.filter((item) => item.startsWith(VARIABLE_PREFIX));

	const variableDataMap = {} as Record<string, string>;
	variableData.map((item) => {
		const value = figma.root.getPluginData(item);
		const key = item.replace(VARIABLE_PREFIX, '');
		variableDataMap[key] = value;
	});

	emit(GET_VARIABLE_DATA.RESPONSE_KEY, variableDataMap);
};

export const onGetVariableData = () => {
	on(GET_VARIABLE_DATA.REQUEST_KEY, getVariableData);
};

export const onGetVariableDataResponse = () => {
	emit(GET_VARIABLE_DATA.REQUEST_KEY);
	return on(GET_VARIABLE_DATA.RESPONSE_KEY, (data: Record<string, string>) => {
		variableDataSignal.value = data;
	});
};

export const onSetVariableData = () => {
	on(SET_VARIABLE_DATA.REQUEST_KEY, (key: string, value: string) => {
		figma.root.setPluginData(VARIABLE_PREFIX + key.toUpperCase(), value);
		getVariableData();
	});
};

export const onClearVariableData = () => {
	on(CLEAR_VARIABLE_DATA.REQUEST_KEY, () => {
		const data = figma.root.getPluginDataKeys();
		const variableData = data.filter((item) => item.startsWith(VARIABLE_PREFIX));
		variableData.map((item) => {
			figma.root.setPluginData(item, '');
		});
		getVariableData();
	});
};
