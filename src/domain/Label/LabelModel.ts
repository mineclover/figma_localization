import { CurrentCursorType, NodeData } from '@/model/types';
import { emit, on } from '@create-figma-plugin/utilities';
import {
	GET_CURSOR_POSITION,
	GET_PROJECT_ID,
	GET_STYLE_DATA,
	NODE_STORE_KEY,
	PAGE_LOCK_KEY,
	SET_NODE_ACTION,
	SET_PROJECT_ID,
	STORE_KEY,
} from '../constant';

import { FilePathNodeSearch, notify } from '@/figmaPluginUtils';
import { getNodeData } from './TextPluginDataModel';
import { fetchDB } from '../utils/fetchDB';
import { ERROR_CODE } from '../errorCode';
import { removeLeadingSymbols } from '@/utils/textTools';
import { currentPointerSignal, projectIdSignal } from '@/model/signal';

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

export const getCursorPosition = (node: BaseNode) => {
	if (node && node.type === 'TEXT') {
		// 첫번째 섹션
		// const result = FilePathNodeSearch(node);
		// const sectionNode = result.find((node) => node.type === 'SECTION');

		// if (sectionNode) {
		// 	const text = sectionNode.name.trim();

		// 	const sectionName = text;
		// 	sectionData.name = sectionName;
		// 	sectionData.section_id = sectionNode.id;
		// }

		const projectId = getProjectId();
		if (!projectId) {
			return;
		}
		const NodeData = getNodeData(node);
		const pageLock = figma.currentPage.getPluginData(PAGE_LOCK_KEY) === 'true';

		const cursorPosition: CurrentCursorType = {
			projectId,

			pageName: figma.currentPage.name,
			pageId: figma.currentPage.id,
			nodeName: removeLeadingSymbols(node.name),
			nodeId: node.id,
			characters: node.characters,
			autoRename: node.autoRename,
			data: NodeData,
			pageLock: pageLock,
		};

		return cursorPosition;
	}
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
