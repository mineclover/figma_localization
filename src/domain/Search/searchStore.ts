import { CurrentCursorType, NodeData, SearchNodeData } from '@/model/types';
import { BACKGROUND_STORE_KEY, NODE_STORE_KEY } from '../constant';
import { SectionSearch } from '@/figmaPluginUtils';
import { safeJsonParse } from '../utils/getStore';

/**
 * absoluteRenderBounds : 자식과 효과를 포함해서 렌더링되는 전체 크기
 * - clip contents 하면 더 작아짐
 * absoluteBoundingBox : 컨테이너 사이즈
 */
//
const nodeMetric = (node: TextNode, count: number = 0) => {
	/** 화면에 보여지는 bounds */
	const renderBounds = node.absoluteRenderBounds;
	/** 화면 표시 상관 없이 보여지는 영역 */
	// const boundingBox = node.absoluteBoundingBox;

	if (renderBounds) {
		return {
			x: renderBounds.x,
			y: renderBounds.y,
			width: renderBounds.width,
			height: renderBounds.height,
		};
	}

	// if (renderBounds || boundingBox) {
	// 	return {
	// 		x: renderBounds?.x ?? boundingBox?.x,
	// 		y: renderBounds?.y ?? boundingBox?.y,
	// 		width: renderBounds?.width ?? boundingBox?.width,
	// 		height: renderBounds?.height ?? boundingBox?.height,
	// 	};
	// }
	// else if (count < 4) {
	// 	console.log('🚀 ~ nodeMetric ~ nodeRect:', node, count);
	// 	return nodeMetric(node, count + 1);
	// } else {
	// 	return;
	// }
};

// metadata에 CurrentCursorType 다 넣고 최신화시키는 것에 대해 ..
// 최적화 하게 되면 고려할 수 있는데 그게 지금은 아님

export type MetaData = {
	id: string;
	/** 빼려했는데 검색할 때 필요해서 남겨둠 */
	name: string;
	root: string;
	ignore: boolean;
	localizationKey: string;
	text: string;
	parentName?: string;
	baseNodeId?: string;
	x?: number;
	y?: number;
	width?: number;
	height?: number;
};

export const nodeMetaData = (node: TextNode) => {
	const metric = nodeMetric(node);
	if (metric?.width == null || metric?.height == null) {
	}
	const root = SectionSearch(node);
	// 섹션 있으면 처리 없으면 처리 안함
	const rootId = root.section?.id == null ? root.page.id : root.section.id;

	return {
		id: node.id,
		name: node.name,
		root: rootId,
		ignore: node.getPluginData(NODE_STORE_KEY.IGNORE) === 'true',
		localizationKey: node.getPluginData(NODE_STORE_KEY.LOCALIZATION_KEY),
		baseNodeId: node.getPluginData(NODE_STORE_KEY.LOCATION),
		text: node.characters,
		parentName: node.parent?.name,
		...metric,
	} as MetaData;
};

export const getFrameNodeMetaData = (node: FrameNode) => {
	return safeJsonParse<MetaData>(node.getPluginData(BACKGROUND_STORE_KEY.data));
};

export const setFrameNodeMetaData = (node: FrameNode, data: MetaData) => {
	node.setPluginData(BACKGROUND_STORE_KEY.data, JSON.stringify(data));
};

/** figma 클라이언트 */
class SearchStore {
	store: Map<string, MetaData>;
	// 조회 기준 데이터 저장 목적
	sectionStore: Map<string, Set<string>>;
	// 베이스노드를 공유하는 키 저장 목적임
	baseNodeStore: Map<string, Set<string>>;
	// 텍스트 노드를 프레임 노드로 매핑하는 목적
	textToFrameStore: Map<string, FrameNode | null>;
	constructor() {
		this.store = new Map<string, MetaData>();
		this.sectionStore = new Map<string, Set<string>>();
		this.baseNodeStore = new Map<string, Set<string>>();
		this.textToFrameStore = new Map<string, FrameNode | null>();
	}

	/**
	 * 노드 저장

	 * @param textNode 노드
	 * @returns 노드 메타 데이터
	 */
	setStore(textNode: BaseNode) {
		const key = textNode.id;
		const meta = nodeMetaData(textNode as TextNode);
		if (meta.baseNodeId) {
			this.setBaseNode(meta.baseNodeId, key);
		}

		this.store.set(key, meta);
		return meta;
	}

	setFrameStore(textId: string, frameNode: FrameNode) {
		this.textToFrameStore.set(textId, frameNode);
	}

	refresh() {
		if (this.isFigma()) {
			const nodes = figma.currentPage.findAllWithCriteria({
				types: ['TEXT'],
			});
			nodes.forEach((node) => {
				this.setStore(node);
			});
		}
	}

	partialRefresh(input: string) {
		if (this.isFigma()) {
			const nodes = figma.currentPage.findAllWithCriteria({
				types: ['TEXT'],
				pluginData: {
					keys: [NODE_STORE_KEY.LOCALIZATION_KEY],
				},
			});

			nodes.forEach((node) => {
				this.setStore(node);
			});
			const result = nodes.filter((node) => {
				const key = node.getPluginData(NODE_STORE_KEY.LOCALIZATION_KEY);
				if (key === input) {
					return true;
				}
				return false;
			});

			return result;
		}
	}

	/**
	 * 일단 모든 최신 데이터를 조회
	 * @param ignoreSectionIds
	 * @returns
	 */
	async search(ignoreSectionIds: string[] = [], cacheCall: boolean = false) {
		const metadata: MetaData[] = [];
		const searchNodes: TextNode[] = [];
		if (this.isFigma()) {
			// 일단 갱신

			/**
			 * 일단 항상 최신 데이터를 조회
			 */
			const targetAreas = figma.currentPage.children
				.filter((child) => !ignoreSectionIds.includes(child.id))
				.filter((item) => item.type === 'SECTION');

			if (targetAreas.length === 0) {
				return { metadata, searchNodes }; // []
			}
			// 섹션들에서 조회

			for (const targetArea of targetAreas) {
				const areaId = targetArea.id;
				if (targetArea.type === 'SECTION') {
					let sectionStore = this.sectionStore.get(areaId);
					if (sectionStore == null) {
						sectionStore = new Set<string>();
						this.sectionStore.set(areaId, sectionStore);
					}
					const nodes = targetArea.findAllWithCriteria({
						types: ['TEXT'],
					});
					sectionStore.clear();
					nodes.forEach((node) => {
						this.setStore(node);
						sectionStore.add(node.id);
						searchNodes.push(node);
					});
				}

				// 섹션 아이디로 스토어에서 얻어보고 없으면 빈 배열 반환
				const keys = this.sectionStore.get(areaId);
				//스토어에서 얻어보고 없으면 빈 배열 반환
				if (keys == null) {
					continue;
					// 없으면 다음 섹션으로 넘어감
				}

				for (const key of keys) {
					const node = await this.get(key);
					if (node != null) {
						metadata.push(node);
					}
				}
				continue;
			}
			return { metadata, searchNodes };
		} else {
			return { metadata, searchNodes };
		}
	}

	async get(key: string) {
		const node = this.store.get(key);
		if (node && this.nodeValid(node)) {
			return node;
		} else {
			return await this.update(key);
		}
	}

	nodeValid(node: MetaData) {
		return typeof node.id === 'string';
	}

	isFigma() {
		return typeof figma !== 'undefined';
	}

	async update(key: string) {
		if (this.isFigma()) {
			const node = await figma.getNodeByIdAsync(key);
			if (node) {
				return this.setStore(node);
			} else {
				this.store.delete(key);
			}
			return;
		} else {
			throw new Error('figma is not defined');
		}
	}
	clear() {
		this.store.clear();
	}

	has(key: string) {
		return this.store.has(key);
	}

	size() {
		return this.store.size;
	}

	keys() {
		return this.store.keys();
	}

	getAll() {
		return this.store;
	}

	/**
	 *
	 * @param baseId 베이스 노드 id
	 * @param nodeId 인스턴스 노드 id
	 */
	setBaseNode(baseId: string, nodeId: string) {
		let baseSet = this.baseNodeStore.get(baseId);
		if (baseSet == null) {
			baseSet = new Set<string>();
			this.baseNodeStore.set(baseId, baseSet);
		}
		baseSet.add(nodeId);
	}

	getBaseNode(baseId: string) {
		return Array.from(this.baseNodeStore.get(baseId) ?? []);
	}

	/**
	 * 기존 노드들 설정에서 before 베이스 노드를 캐싱함 store에서 삭제하고
	 * after 베이스 노드로 캐싱 store에 추가
	 * baseNode는 특정 노드가 지목하는 대상임
	 * remove 있으면 삭제하고 이동
	 * @param before 이전 베이스 노드 ( baseNode에 있어야 함 )
	 * @param after  새로운 베이스 노드 ( baseNode 내 세션에 있어야 함? )
	 * @param remove
	 */
	async baseChange(before: string, after: string) {
		let baseSet = this.baseNodeStore.get(before);

		// 선택된 대상들을 어떻게 전달할 것인가
		// 원래는 스토어로 찾아질 줄 알았음
		// 그런데 스토어가 제대로 동작을 안함
		// 난 변경된 대상이 baseNode 였으면 그 베이스 노드 쓰던 다른 노드들을 찾아서 변경해야 함
		if (baseSet == null) {
			baseSet = new Set<string>();

			console.log(2, '없으면 처리 안하는게 맞음');
			return;
		}
		// remove 있으면 삭제하고 이동

		// 추가
		baseSet.add(after);

		// 이동
		this.baseNodeStore.set(after, baseSet);
		console.log('🚀 ~ SearchStore ~ baseChange ~ baseSet:', baseSet);
		for (const afterNodeId of baseSet) {
			const afterNode = await figma.getNodeByIdAsync(afterNodeId);

			if (afterNode) {
				afterNode.setPluginData(NODE_STORE_KEY.LOCATION, after);

				// 캐싱 store에 변경 반영하고 node 메타데이터 추가
				this.setStore(afterNode);
			}
		}
		// 안쓰는 스토어 삭제

		this.baseNodeStore.delete(before);
	}
}

export const searchStore = new SearchStore();
