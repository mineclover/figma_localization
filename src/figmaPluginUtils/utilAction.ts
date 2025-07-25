import { emit } from '@create-figma-plugin/utilities'
import type { NodeZoomHandler, PageNodeZoomHandler, PageSelectIdsHandler, PageSelectIdsToBoxHandler } from './types'

export const nodeZoomAction = (pageId: string, nodeId: string) => {
	emit<NodeZoomHandler>('NODE_ZOOM', { pageId, nodeId })
}

export const pageNodeZoomAction = (nodeId: string, select: boolean = true) => {
	emit<PageNodeZoomHandler>('PAGE_NODE_ZOOM', { nodeId, select })
}

export const selectIdsAction = (ids: string[]) => {
	emit<PageSelectIdsHandler>('PAGE_SELECT_IDS', { ids })
}

export const selectIdsToBoxAction = (ids: string[], select: boolean = true) => {
	emit<PageSelectIdsToBoxHandler>('PAGE_SELECT_IDS_TO_BOX', { ids, select })
}
