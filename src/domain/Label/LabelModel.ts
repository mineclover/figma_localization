import { NodeData, Preset, PresetStore } from '@/model/types';
import { emit, on } from '@create-figma-plugin/utilities';
import {
	GET_CURSOR_POSITION,
	GET_PRESET,
	GET_PROJECT_ID,
	GET_STYLE_DATA,
	NODE_STORE_KEY,
	SET_NODE_ACTION,
	SET_PRESET,
	SET_PROJECT_ID,
	STORE_KEY,
} from '../constant';

import { FilePathNodeSearch, notify, SectionSearch } from '@/figmaPluginUtils';
import { fetchDB } from '../utils/fetchDB';
import { ERROR_CODE } from '../errorCode';
import { currentPointerSignal, projectIdSignal } from '@/model/signal';
import { safeJsonParse } from '../utils/getStore';
import { getCursorPosition } from '../getState';

export const getProjectId = () => {
	const fileKey = figma.fileKey;
	if (fileKey) {
		return fileKey;
	}

	const key = figma.root.getPluginData(STORE_KEY.PROJECT_ID);
	if (key) {
		return key;
	}

	notify('editor 최초 설정 필요', 'error');
};

export const onGetProjectId = () => {
	on(GET_PROJECT_ID.REQUEST_KEY, () => {
		const projectId = getProjectId();

		if (projectId) {
			emit(GET_PROJECT_ID.RESPONSE_KEY, projectId);
		}
	});
};

export const onSetProjectId = () => {
	return on(SET_PROJECT_ID.REQUEST_KEY, (projectId: string) => {
		figma.root.setPluginData(STORE_KEY.PROJECT_ID, projectId);
		emit(GET_PROJECT_ID.RESPONSE_KEY, projectId);
	});
};

export const onSetProjectIdResponse = () => {
	emit(GET_PROJECT_ID.REQUEST_KEY);
	return on(GET_PROJECT_ID.RESPONSE_KEY, (projectId: string) => {
		projectIdSignal.value = projectId;
	});
};

export const sectionNameParser = (text: string) => {
	const regex = /^\[(.*?)\]/;
	const matches = regex.exec(text);
	if (matches) {
		if (matches[1] === 'undefined') {
			return null;
		}
		return matches[1];
	}
	return null;
};

export const onSetNodeAction = () => {
	on(SET_NODE_ACTION.REQUEST_KEY, (data: NodeData) => {
		const node = figma.currentPage.selection[0];

		for (const [key, value] of Object.entries(data)) {
			// 널이 아닐 때만 설정

			if (key === 'localizationKey' && value != null) {
				node.setPluginData(NODE_STORE_KEY.LOCALIZATION_KEY, value);
			} else if (key === 'location' && value != null) {
				node.setPluginData(NODE_STORE_KEY.LOCATION, value);
			} else if (key === 'domainId' && value != null) {
				node.setPluginData(NODE_STORE_KEY.DOMAIN_ID, value);
			} else if (key === 'ignore' && value != null) {
				node.setPluginData(NODE_STORE_KEY.IGNORE, value);
			} else if (key === 'action' && value != null) {
				node.setPluginData(NODE_STORE_KEY.ACTION, value);
			} else if (key === 'modifier' && value != null) {
				node.setPluginData(NODE_STORE_KEY.MODIFIER, value);
			}
		}
		const result = getCursorPosition(node);
		emit(GET_CURSOR_POSITION.RESPONSE_KEY, result);
	});
};

export const onSetPreset = () => {
	on(SET_PRESET.REQUEST_KEY, (oldName: string, preset: Preset) => {
		const name = preset.name.trim() === '' ? 'recent' : preset.name;
		const presetStore = safeJsonParse<PresetStore>(figma.root.getPluginData(STORE_KEY.PRESET)) ?? {};
		// 이전 값 삭제
		delete presetStore[oldName];
		// 새로운 값 추가 ( 오버라이드도 됨 )
		presetStore[name] = preset;
		// 저장
		figma.root.setPluginData(STORE_KEY.PRESET, JSON.stringify(presetStore));
	});
};

export const onGetPreset = () => {
	on(GET_PRESET.REQUEST_KEY, () => {
		const preset = figma.root.getPluginData(STORE_KEY.PRESET);
		if (preset) {
			const presetData = safeJsonParse<PresetStore>(preset);
			emit(GET_PRESET.RESPONSE_KEY, presetData);
		}
	});
};
