import { emit } from '@create-figma-plugin/utilities'
import { NodeZoomHandler } from './types'

export const nodeZoomAction = (pageId: string, nodeId: string) => {
	emit<NodeZoomHandler>('NODE_ZOOM', { pageId, nodeId })
}
