import { EventHandler } from '@create-figma-plugin/utilities';

export interface CloseHandler extends EventHandler {
	name: 'CLOSE';
	handler: () => void;
}

export interface ResizeWindowHandler extends EventHandler {
	name: 'RESIZE_WINDOW';
	handler: (windowSize: { width: number; height: number }) => void;
}

export interface NodeZoomHandler extends EventHandler {
	name: 'NODE_ZOOM';
	handler: ({ pageId, nodeId }: { pageId: string; nodeId: string }) => void;
}

export interface PageNodeZoomHandler extends EventHandler {
	name: 'PAGE_NODE_ZOOM';
	handler: ({ nodeId, select }: { nodeId: string; select?: boolean }) => void;
}

export interface PageSelectIdsHandler extends EventHandler {
	name: 'PAGE_SELECT_IDS';
	handler: ({ ids }: { ids: string[] }) => void;
}

export interface PageSelectIdsToBoxHandler extends EventHandler {
	name: 'PAGE_SELECT_IDS_TO_BOX';
	handler: ({ ids, select }: { ids: string[]; select: boolean }) => void;
}
