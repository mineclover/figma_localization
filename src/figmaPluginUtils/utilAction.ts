import { emit } from '@create-figma-plugin/utilities'
import type { NodeZoomHandler, PageNodeZoomHandler } from './types'

export const nodeZoomAction = (pageId: string, nodeId: string) => {
  emit<NodeZoomHandler>('NODE_ZOOM', { pageId, nodeId })
}

export const pageNodeZoomAction = (nodeId: string, select: boolean = true) => {
  emit<PageNodeZoomHandler>('PAGE_NODE_ZOOM', { nodeId, select })
}
