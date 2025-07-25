import { on } from '@create-figma-plugin/utilities'
import type { NodeZoomHandler, PageNodeZoomHandler, PageSelectIdsHandler } from './types'

/** 특정 값으로 노드 줌 */
export const nodeZoom_Adapter = () => {
	on<NodeZoomHandler>('NODE_ZOOM', async ({ nodeId, pageId }) => {
		const page = figma.root.findChild(node => node.id === pageId && node.type === 'PAGE') as PageNode | null
		if (!page) {
			return
		}
		// 페이지 이동 시켜줘야 줌이 됨
		await figma.setCurrentPageAsync(page)
		// 현재 페이지를 찾은 페이지로 설정
		// figma 내에서 노드 찾기
		const node = (await figma.getNodeByIdAsync(nodeId)) as SceneNode
		// 아래 코드보다 위 코드가 빠름
		// const node = page.findOne((n) => n.id === nodeId);

		if (node) {
			// 노드로 화면 줌
			figma.currentPage.selection = [node]
			figma.viewport.scrollAndZoomIntoView([node])
		}
	})
}

/** 특정 값으로 노드 줌 */
export const pageNodeZoom_Adapter = () => {
	on<PageNodeZoomHandler>('PAGE_NODE_ZOOM', async ({ nodeId, select }) => {
		const node = (await figma.getNodeByIdAsync(nodeId)) as SceneNode
		console.log('🚀 ~ on<PageNodeZoomHandler> ~ node:', node)
		if (node) {
			// 노드로 화면 줌

			if (select) {
				figma.currentPage.selection = [node]
				figma.viewport.scrollAndZoomIntoView([node])
			} else {
				figma.viewport.scrollAndZoomIntoView([node])
			}
		}
	})
}

/** 특정 값으로 노드 줌 */
export const pageSelectIds_Adapter = () => {
	on<PageSelectIdsHandler>('PAGE_SELECT_IDS', async ({ ids }) => {
		const nodes = figma.currentPage.findAll(node => ids.includes(node.id))

		if (nodes) {
			// 노드로 화면 줌
			figma.currentPage.selection = nodes
			figma.viewport.scrollAndZoomIntoView(nodes)
		}
	})
}
