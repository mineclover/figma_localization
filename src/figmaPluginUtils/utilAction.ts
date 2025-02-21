import { emit } from '@create-figma-plugin/utilities'
import { NodeZoomHandler } from './types'
import { ComponentKey } from '@/domain/types'
import { componentKeyParser } from '@/domain/interfaceBuilder'

export const nodeZoomAction = (key: ComponentKey) => {
	const data = componentKeyParser(key)

	if (data) {
		const { pageId, nodeId } = data
		emit<NodeZoomHandler>('NODE_ZOOM', { pageId, nodeId })
	}
}
