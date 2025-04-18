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
import { BACKGROUND_SYMBOL, ignoreSectionAll } from '@/domain/Search/visualModel';
import { nodeMetaData, searchStore } from '@/domain/Search/searchStore';

export let tempNode = '';
export let downloadStatus = {
	downloading: false,
	date: new Date(),
};

const refreshNode = async (node: SceneNode) => {
	if (downloadStatus.downloading) {
		return;
	}
	tempNode = node.id;
	const cursorPosition = await getCursorPosition(node);
	emit(GET_CURSOR_POSITION.RESPONSE_KEY, cursorPosition);
	const localizationKey = await processTextNodeLocalization(node);
	emit(GET_LOCALIZATION_KEY_VALUE.RESPONSE_KEY, localizationKey);
	const styleData = await newGetStyleData(node.id);
	emit(GET_STYLE_DATA.RESPONSE_KEY, styleData);
};

export const isOverlayFrame = (node: SceneNode) => {
	return node.parent?.name === '##overlay';
};

export const overlayFrameInfo = (node: SceneNode) => {
	const id = node.getPluginData(BACKGROUND_SYMBOL.idStore);
	if (id) {
		return id;
	}
	return null;
};

export const onNodeSelectionChange = () => {
	figma.on('selectionchange', async () => {
		const nodes = figma.currentPage.selection;

		// 선택 된 게 overlay 프레임 내에 있는 경우 선택을 조정한다
		// 일단 선택 된 게 overlay 프레임 내에 있는 경우를 판단

		if (nodes.length === 1) {
			const node = nodes[0];
			const isOverlay = isOverlayFrame(node);
			// 선택 대상이 한 개 인데 오버레이 프레임임
			if (isOverlay) {
				// 오버레이 프레임 정보 가져옴
				const id = overlayFrameInfo(node);
				if (id) {
					// 오버레이 프레임 정보로 텍스트 노드 선택함
					const textNode = (await figma.getNodeByIdAsync(id)) as TextNode;
					// 같은 로컬라이제이션 키를 가진 텍스트 노드 조회함
					const metaData = await searchStore.update(textNode.id);
					// 조회했을 때 키가 있는지 확인하고 메타데이터 가져옴

					if (metaData && metaData.localizationKey) {
						// 파티션 키로 텍스트 노드 조회
						const textNodes = searchStore.partialRefresh(metaData.localizationKey);

						// 제외 영역
						const ignoreIds = ignoreSectionAll().map((node) => node.id);
						if (textNodes) {
							const textNodeData = textNodes.map((node) => nodeMetaData(node));
							// ignoreIds 에 포함되지 않는 노드만 선택하고 아이디 배열로 변환
							const filteredTextNodes = textNodeData
								.filter((node) => !ignoreIds.includes(node.root))
								.map((node) => node.id);

							const pointer = textNodes.filter((node) => filteredTextNodes.includes(node.id));
							figma.currentPage.selection = pointer;
						}
					}
				}
			}
		}
		if (nodes.length > 1) {
			const frames = nodes.filter((node) => isOverlayFrame(node));
			frames;
		}

		const node = nodes[0];
		/** 업데이트 반영 코드 */
		if (node && tempNode !== node.id) {
			tempNode = node.id;
			refreshNode(node);
		}
		const sectionId = getCurrentSectionSelected(node);
		emit(CURRENT_SECTION_SELECTED.RESPONSE_KEY, sectionId);
	});
};

/**
 * 선택 영역에서 텍스트 변경 감지
 * (현재 선택된 페이지에서 선택된 노드 스타일 변경 시 업데이트를 위함)
 * */
const textStyleChangeEvent = async (event: NodeChangeEvent) => {
	const nodes = event.nodeChanges
		.filter((eventData) => {
			if (eventData.type === 'PROPERTY_CHANGE') {
				return eventData.properties.some((eventName) => {
					return !['x', 'y', 'relativeTransform', 'height', 'width'].includes(eventName);
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
		refreshNode(currentNode);
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
