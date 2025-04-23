import { emit } from '@create-figma-plugin/utilities';
import {
	GET_CURSOR_POSITION,
	GET_LOCALIZATION_KEY_VALUE,
	CURRENT_SECTION_SELECTED,
	GET_STYLE_DATA,
	STORE_KEY,
	NODE_STORE_KEY,
	RENDER_PAIR,
} from '../../domain/constant';
import { getCurrentSectionSelected } from '../../domain/Translate/TranslateModel';
import { getCursorPosition } from '../../domain/Label/LabelModel';
import { processTextNodeLocalization } from '../../domain/Label/TextPluginDataModel';
import { newGetStyleData } from './GET_STYLE_DATA';
import {
	autoSelectNodeEmit,
	baseNodeCheck,
	getBackgroundFrame,
	ignoreSectionAll,
	isHideNode,
	nullSelectEmit,
	overRayRender,
} from '@/domain/Search/visualModel';
import { BACKGROUND_STORE_KEY } from '@/domain/constant';
import {
	getFrameNodeMetaData,
	MetaData,
	nodeMetaData,
	searchStore,
	setFrameNodeMetaData,
} from '@/domain/Search/searchStore';
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
	const metaData = getFrameNodeMetaData(node as FrameNode);
	if (metaData) {
		return metaData;
	}
	return;
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
	const metaDataStore = new Map<string, FrameNode>();

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
				if (searchStore.textToFrameStore.size === 0) {
					await overRayRender();
				}

				// 오버레이 프레임 정보 가져옴
				const metaData = overlayFrameInfo(node);

				// 정보가 있으면
				if (metaData != null) {
					const { baseNodeId } = metaData;
					// 오버레이 프레임 정보로 텍스트 노드 선택함

					if (baseNodeId) {
						const baseNode = searchStore.baseNodeStore.get(baseNodeId);
						if (baseNode) {
							// baseNode 에서 조회하는 건 로컬라이제이션 텍스트
							// 배경 프레임에서 조회해야하는 건 배경 프레임

							const targetFrames = Array.from(baseNode)
								.map((item) => {
									return searchStore.textToFrameStore.get(item);
								})
								.filter((item) => {
									return item != null;
								});

							if (targetFrames.length > 0) {
								selectCycleStore.localizationKey = metaData.localizationKey;
								selectCycleStore.baseNodeId = baseNodeId;
								figma.currentPage.selection = targetFrames;
							}
						}
					}
					// 프레임 노드 조회 = 다중 선택
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
			// frames 는 새로운 프레임 노드들임
			for (const node of frames) {
				const isOverlay = isOverlayFrame(node);
				// 선택 대상이 있고 오버레이 프레임
				if (isOverlay) {
					// 오버레이 프레임 정보 가져옴
					const metaData = overlayFrameInfo(node);
					if (metaData) {
						const newMetaData = {
							...metaData,
							localizationKey: selectCycleStore.localizationKey,
						};
						setFrameNodeMetaData(node as FrameNode, newMetaData);
						nextPointer.push(node);
						cacheCheck.add(node.id);
					}
				}
			}
			// 처리 된 노드가 있으면 오버레이 리렌더링
			if (nextPointer.length > 0) {
				const currentSelection = figma.currentPage.selection;
				const arr = currentSelection.map((item) => item.id);

				// baseNode를 가지고 있는 대상
				if (!arr.includes(selectCycleStore.baseNodeId)) {
					const temp = arr[0];
					currentSelection.forEach((node) => {
						if (node) {
							node.setPluginData(NODE_STORE_KEY.LOCATION, temp);
						}
					});
				}
				// 선택 리스트에 추가

				// 선택 값 변경
			}
			// next가 0이여서도 0인건 아님
		} else {
			nullSelectEmit();
		}
		const backgroundFrame = getBackgroundFrame();
		if (backgroundFrame) {
			await overRayRender();
		}
		const node = nodes[0];
		/** 업데이트 반영 코드 */
		if (node && tempNode !== node.id) {
			tempNode = node.id;
			refreshNode(node);
		}

		const hasKey: MetaData[] = [];

		for (const node of figma.currentPage.selection) {
			const metaData = getFrameNodeMetaData(node as FrameNode);
			// 화면에 보이지 않는 노드는 무시하도록 구성
			if (metaData && !isHideNode(metaData)) {
				hasKey.push(metaData);
			}
		}
		console.log(6, new Date().toISOString());

		const sectionId = getCurrentSectionSelected(node);
		await autoSelectNodeEmit(hasKey);
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
