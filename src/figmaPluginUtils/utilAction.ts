import { emit } from '@create-figma-plugin/utilities'
import { NodeZoomHandler, PageNodeZoomHandler } from './types'

export const nodeZoomAction = (pageId: string, nodeId: string) => {
	emit<NodeZoomHandler>('NODE_ZOOM', { pageId, nodeId })
}

export const pageNodeZoomAction = (nodeId: string) => {
	emit<PageNodeZoomHandler>('PAGE_NODE_ZOOM', { nodeId })
}
