import { emit } from '@create-figma-plugin/utilities';
import {
	GET_CURSOR_POSITION,
	GET_LOCALIZATION_KEY_VALUE,
	CURRENT_SECTION_SELECTED,
	GET_STYLE_DATA,
	STORE_KEY,
	NODE_STORE_KEY,
} from '../../domain/constant';
import { getCurrentSectionSelected } from '../../domain/Translate/TranslateModel';
import { getCursorPosition } from '../../domain/Label/LabelModel';
import { processTextNodeLocalization } from '../../domain/Label/TextPluginDataModel';
import { newGetStyleData } from './GET_STYLE_DATA';
import {
	autoSelectNodeEmit,
	baseNodeCheck,
	ignoreSectionAll,
	isHideNode,
	nullSelectEmit,
	overRayRender,
} from '@/domain/Search/visualModel';
import { BACKGROUND_SYMBOL } from '@/domain/constant';
import { MetaData, nodeMetaData, searchStore } from '@/domain/Search/searchStore';
import { read } from 'fs';

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

const DEBUG_MODE = false;

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

let selectCycleStore = {
	localizationKey: '',
	baseNodeId: '',
} as {
	localizationKey: string;
	baseNodeId: string;
};

export const onNodeSelectionChange = () => {
	/** 선택은 연속적으로 일어나고 그 사이에 노드 메타데이터 변경될 일이 없다 */
	const cacheCheck = new Set<string>();
	figma.on('selectionchange', async () => {
		const nodes = figma.currentPage.selection;

		// 선택 된 게 overlay 프레임 내에 있는 경우 선택을 조정한다
		// 일단 선택 된 게 overlay 프레임 내에 있는 경우를 판단
		console.log(1, new Date().toISOString());

		if (nodes.length === 1) {
			cacheCheck.clear();
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
					console.log(2, new Date().toISOString());

					if (metaData && metaData.localizationKey) {
						// 파티션 키로 텍스트 노드 조회
						console.log(3, new Date().toISOString());
						const textNodes = searchStore.partialRefresh(metaData.localizationKey);

						// 제외 영역
						const ignoreIds = ignoreSectionAll().map((node) => node.id);
						if (textNodes) {
							console.log(4, new Date().toISOString());
							const textNodeData = textNodes.map((node) => nodeMetaData(node));
							// ignoreIds 에 포함되지 않는 노드만 선택하고 아이디 배열로 변환
							const filteredTextNodesMeta = textNodeData.filter((node) => !ignoreIds.includes(node.root));

							const filteredTextNodes = filteredTextNodesMeta.map((node) => node.id);
							const pointer = textNodes.filter((node) => filteredTextNodes.includes(node.id));
							if (!DEBUG_MODE) {
								console.log('🚀 ~ figma.on ~ DEBUG_MODE:', DEBUG_MODE);

								figma.currentPage.selection = pointer;
							}
							// 돈으로 삼
							const arr = pointer.map((node) => node.id);
							// 캐시 잇이[읗
							arr.forEach((id) => cacheCheck.add(id));
							selectCycleStore.localizationKey = metaData.localizationKey;
							selectCycleStore.baseNodeId = metaData.baseNodeId ?? '';
							console.log('🚀 ~ figma.on ~ 노드 병경 됨 selectCycleStore.baseNodeId :', selectCycleStore.baseNodeId);
							console.log(5, new Date().toISOString(), filteredTextNodesMeta);
							await autoSelectNodeEmit(filteredTextNodesMeta);
						}
					}
				}
			}
			/** 확장 선택 시 땅따먹기 처리 */
		} else if (nodes.length > 1) {
			/** 기존에 처리된 대상은 제외 */
			const frames = nodes.filter((node) => {
				if (cacheCheck.has(node.id)) {
					return false;
				}
				return isOverlayFrame(node);
			});
			const nextPointer = [];
			console.log(4, new Date().toISOString());
			for (const node of frames) {
				const isOverlay = isOverlayFrame(node);
				// 선택 대상이 있고 오버레이 프레임
				if (isOverlay) {
					// 오버레이 프레임 정보 가져옴
					const id = overlayFrameInfo(node);
					if (id) {
						// 오버레이 프레임 정보로 텍스트 노드 선택하고 변환함
						const textNode = (await figma.getNodeByIdAsync(id)) as TextNode;
						console.log(5, new Date().toISOString());
						textNode.setPluginData(NODE_STORE_KEY.LOCALIZATION_KEY, selectCycleStore.localizationKey);

						// node가 baseNode 인지 확인
						const isBaseNode = baseNodeCheck(textNode);
						console.log('🚀 ~ figma.on ~ isBaseNode:', isBaseNode);
						if (isBaseNode) {
							console.log('🚀 ~ figma.on ~ isBaseNode:', textNode.id, selectCycleStore.baseNodeId);
							await searchStore.rootChange(textNode.id, selectCycleStore.baseNodeId, true);
						}

						nextPointer.push(textNode);
						cacheCheck.add(textNode.id);
					}
				}
			}

			if (nextPointer.length > 0) {
				await overRayRender();
				const currentSelection = figma.currentPage.selection;

				const arr = [...currentSelection, ...nextPointer];
				if (!DEBUG_MODE) {
					console.log('🚀 ~ figma.on ~ DEBUG_MODE:', DEBUG_MODE);

					figma.currentPage.selection = arr;
				}

				const hasKey: MetaData[] = [];

				for (const node of arr) {
					const metaData = await searchStore.get(node.id);
					// 화면에 보이지 않는 노드는 무시하도록 구성
					if (metaData && !isHideNode(metaData)) {
						hasKey.push(metaData);
					}
				}
				console.log(6, new Date().toISOString());
				await autoSelectNodeEmit(hasKey);
			}
			// next가 0이여서도 0인건 아님
		} else {
			nullSelectEmit();
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
