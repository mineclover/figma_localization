import { CurrentCursorType, NodeData, SearchNodeData } from '@/model/types';
import { NODE_STORE_KEY } from '../constant';
import { SectionSearch } from '@/figmaPluginUtils';

/**
 * absoluteRenderBounds : 자식과 효과를 포함해서 렌더링되는 전체 크기
 * - clip contents 하면 더 작아짐
 * absoluteBoundingBox : 컨테이너 사이즈
 */
//
const nodeMetric = (node: TextNode) => {
	const nodeRect = node.absoluteRenderBounds;
	if (nodeRect) {
		const { width, height, x, y } = nodeRect;
		return {
			x,
			y,
			width,
			height,
		};
	}
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
	x: number;
	y: number;
	width: number;
	height: number;
};

export const nodeMetaData = (node: TextNode) => {
	const metric = nodeMetric(node);
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

/** figma 클라이언트 */
class SearchStore {
	store: Map<string, MetaData>;
	// 조회 기준 데이터 저장 목적
	sectionStore: Map<string, Set<string>>;
	// 키 저장 목적임

	constructor() {
		this.store = new Map<string, MetaData>();
		this.sectionStore = new Map<string, Set<string>>();
	}

	setStore(key: string, node: BaseNode) {
		const meta = nodeMetaData(node as TextNode);
		this.store.set(key, meta);
		return meta;
	}

	refresh() {
		if (this.isFigma()) {
			const nodes = figma.currentPage.findAllWithCriteria({
				types: ['TEXT'],
			});
			nodes.forEach((node) => {
				this.setStore(node.id, node);
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
				this.setStore(node.id, node);
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

	async search(ignoreSectionIds: string[] = []) {
		const nodes: MetaData[] = [];
		if (this.isFigma()) {
			// 일단 갱신

			/**  */
			const targetAreas = figma.currentPage.children
				.filter((child) => !ignoreSectionIds.includes(child.id))
				.filter((item) => item.type === 'SECTION');

			if (targetAreas.length === 0) {
				return nodes;
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
						this.setStore(node.id, node);
						sectionStore.add(node.id);
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
						nodes.push(node);
					}
				}
				continue;
			}
			return nodes;
		} else {
			return nodes;
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
				return this.setStore(key, node);
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
}

export const searchStore = new SearchStore();
