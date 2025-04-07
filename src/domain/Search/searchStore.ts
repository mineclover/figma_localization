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
	x: number;
	y: number;
	width: number;
	height: number;
};

const nodeMetaData = (node: TextNode) => {
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
		text: node.characters,
		...metric,
	} as MetaData;
};

/** figma 클라이언트 */
class SearchStore {
	store: Map<string, MetaData>;
	sectionStore: Map<string, Set<string>>;
	// 조회 기준 데이터 저장 목적

	constructor() {
		this.store = new Map<string, MetaData>();
		this.sectionStore = new Map<string, Set<string>>();
	}

	setStore(key: string, node: BaseNode) {
		this.store.set(key, nodeMetaData(node as TextNode));
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

	async search(targetAreaId?: string) {
		if (this.isFigma()) {
			// 일단 갱신
			const targetArea = targetAreaId ? await figma.getNodeByIdAsync(targetAreaId) : figma.currentPage;
			console.log('🚀 ~ SearchStore ~ search ~ targetArea:', targetArea);

			if (targetArea == null) {
				return;
			}
			const areaId = targetArea.id;
			if (targetArea.type === 'SECTION' || targetArea.type === 'PAGE' || targetArea.type === 'COMPONENT_SET') {
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

			const keys = this.sectionStore.get(areaId);
			if (keys == null) {
				return;
			}
			const nodes = [];
			for (const key of keys) {
				const node = await this.get(key);
				if (node != null) {
					nodes.push(node);
				}
			}
			return nodes;
		} else {
			return [];
		}
	}

	// 기본 계층

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
				this.setStore(key, node);
			} else {
				this.store.delete(key);
			}
			return node;
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
