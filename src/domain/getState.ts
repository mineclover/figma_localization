import { CurrentCursorType, LocationDTO, NodeData } from '@/model/types';
import { removeLeadingSymbols } from '@/utils/textTools';
import { NODE_STORE_KEY, PAGE_LOCK_KEY } from './constant';
import { getProjectId } from './Label/LabelModel';
import { ActionType } from './System/ActionResourceDTO';
import { SectionSearch } from '@/figmaPluginUtils';
import { nodeMetric, MetaData } from './Search/searchStore';

/**
 * 플러그인 데이터는 거의 없음
 * @param node
 * @returns
 */

export const getCursorPosition = (node: BaseNode) => {
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
		characters: node.type === 'TEXT' ? node.characters : '',
		autoRename: node.type === 'TEXT' ? node.autoRename : true,
		data: NodeData,
		pageLock: pageLock,
	};

	return cursorPosition;
}; /** 플러그인 데이터 조회 */

export const getNodeData = (node: BaseNode): NodeData => {
	const localizationKey = node.getPluginData(NODE_STORE_KEY.LOCALIZATION_KEY);

	const domainId = node.getPluginData(NODE_STORE_KEY.DOMAIN_ID);
	const ignore = node.getPluginData(NODE_STORE_KEY.IGNORE) === 'true';
	const action = node.getPluginData(NODE_STORE_KEY.ACTION) as ActionType | '';
	const modifier = node.getPluginData(NODE_STORE_KEY.MODIFIER);

	return {
		localizationKey,

		domainId: domainId || '',
		ignore: ignore || false,
		action: action === '' ? 'default' : action,
		modifier,
	};
};

export const getExtendNodeData = (node: BaseNode) => {
	const nodeData = getNodeData(node);

	return {
		...nodeData,
		id: node.id,
	};
};
/**
 *
 * @param node
 * @returns
 */
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

function convertToRegexPattern(input: string) {
	// 입력이 비어있는 경우 처리
	if (!input || input.trim() === '') {
		return '';
	}

	// 세미콜론이 있는 경우, 왼쪽 부분만 추출
	if (input.includes(';')) {
		const leftPart = input.split(';')[0];
		// 추출한 부분에서 콜론을 하이픈으로 변환
		return leftPart.replace(/:/g, '-');
	} else {
		// 세미콜론이 없는 경우, 모든 콜론을 하이픈으로 변환
		return input.replace(/:/g, '-');
	}
}

// console.log(convertToRegexPattern("2001:1667"));        // 출력: "2001-1667"
// console.log(convertToRegexPattern("I2:2202;2001:1667")); // 출력: "I2-2202"

export const getDirectLink = (data: LocationDTO) => {
	const { node_id, project_id } = data;
	const regexPattern = convertToRegexPattern(node_id);
	const prefixRegex = regexPattern.replace(/^I/, '');

	return `https://www.figma.com/design/${project_id}/Untitled?node-id=${prefixRegex}`;
};

// https://www.figma.com/design/XoSg5aO2cr2Q0eLGI9oTUF/Untitled?node-id=2-9504&t=iJRRv6vCzjcgYnFK-4
// https://www.figma.com/design/XoSg5aO2cr2Q0eLGI9oTUF/Untitled?node-id=2-2202&t=iJRRv6vCzjcgYnFK-4
