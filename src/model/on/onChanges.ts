import { emit } from '@create-figma-plugin/utilities';
import {
	GET_CURSOR_POSITION,
	GET_LOCALIZATION_KEY_VALUE,
	CURRENT_SECTION_SELECTED,
	GET_STYLE_DATA,
} from '../../domain/constant';
import { getCurrentSectionSelected } from '../../domain/Translate/TranslateModel';
import { getCursorPosition } from '../../domain/Label/LabelModel';
import { processTextNodeLocalization } from '../../domain/Label/TextPluginDataModel';
import { newGetStyleData } from './GET_STYLE_DATA';

export let tempNode = '';

export const onNodeSelectionChange = () => {
	figma.on('selectionchange', async () => {
		const node = figma.currentPage.selection[0];
		/** 업데이트 반영 코드 */
		if (node && tempNode !== node.id) {
			tempNode = node.id;
			const cursorPosition = await getCursorPosition(node);
			emit(GET_CURSOR_POSITION.RESPONSE_KEY, cursorPosition);
			const localizationKey = await processTextNodeLocalization(node);
			emit(GET_LOCALIZATION_KEY_VALUE.RESPONSE_KEY, localizationKey);

			const styleData = await newGetStyleData(node.id);
			emit(GET_STYLE_DATA.RESPONSE_KEY, styleData);
		}
		const sectionId = getCurrentSectionSelected(node);
		emit(CURRENT_SECTION_SELECTED.RESPONSE_KEY, sectionId);
	});
};
interface StyleChangeEvent {
	styleChanges: StyleChange[];
}

/**
 * 선택 영역에서 텍스트 변경 감지
 * (현재 선택된 페이지에서 선택된 노드 스타일 변경 시 업데이트를 위함)
 * */
const textStyleChangeEvent = async (event: NodeChangeEvent) => {
	const nodes = event.nodeChanges
		.filter((eventData) => {
			if (eventData.type === 'PROPERTY_CHANGE') {
				return eventData.properties.some((eventName) => {
					return !['x', 'y', 'relativeTransform'].includes(eventName);
				});
			}
		})
		.map((item) => item.node)
		.filter((node) => {
			return node.type === 'TEXT';
		});

	const currentNode = figma.currentPage.selection[0];

	if (!currentNode) {
		return;
	}
	const currentNodeId = currentNode.id;

	const isCurrentChangeNode = nodes.some((node) => {
		return node.id === currentNodeId;
	});

	if (isCurrentChangeNode) {
		const styleData = await newGetStyleData(currentNodeId);
		emit(GET_STYLE_DATA.RESPONSE_KEY, styleData);
	}
};
export const onStyleChange = async () => {
	const pages = new Map<string, PageNode>();
	pages.set(figma.currentPage.id, figma.currentPage);
	figma.currentPage.on('nodechange', textStyleChangeEvent);

	// 변경된 페이지 감지
	figma.on('currentpagechange', () => {
		const id = figma.currentPage.id;
		pages.set(id, figma.currentPage);
		for (const page of pages.values()) {
			page.off('nodechange', textStyleChangeEvent);
		}
		// 노드 변경 감지
		figma.currentPage.on('nodechange', textStyleChangeEvent);
	});
};
