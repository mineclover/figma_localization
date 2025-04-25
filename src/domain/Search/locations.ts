import { LocationDTO } from '@/model/types';
import { SET_NODE_LOCATION } from '../constant';
import { getCursorPosition } from '../getState';
import { getDomainSetting } from '../Setting/SettingModel';
import { fetchDB } from '../utils/fetchDB';
import { setNodeData } from '../Label/TextPluginDataModel';

export const setNodeLocation = async (node: SceneNode) => {
	const domainSetting = getDomainSetting();
	if (!domainSetting) {
		return;
	}

	const currentPointer = getCursorPosition(node);
	if (!currentPointer) {
		return;
	}
	const response = await fetchDB('/figma/locations', {
		method: 'POST',
		body: JSON.stringify({
			projectId: currentPointer.projectId,
			pageId: currentPointer.pageId,
			nodeId: currentPointer.nodeId,
		}),
	});

	if (response.ok) {
		const data = (await response.json()) as LocationDTO;
		const baseNodeId = String(data.location_id);
		setNodeData(node, {
			baseNodeId: baseNodeId,
		});
		return data;
	}

	return;
};

export const idSetLocation = async (nodeId: string) => {
	const node = await figma.getNodeByIdAsync(nodeId);
	if (!node) {
		return;
	}

	return setNodeLocation(node as SceneNode);
};
