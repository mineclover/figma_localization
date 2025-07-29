/**
 * 컴포넌트 최상단 세션 찾기 없으면 undefined
 * @param node
 * @param section
 * @returns
 */
export const FileMetaSearch = (
	node: BaseNode,
	page?: PageNode,
	document?: DocumentNode
): { page: PageNode; document: DocumentNode } | undefined => {
	const parent = node.parent

	if (parent != null) {
		if (parent.type === 'PAGE') {
			const name = parent
			return FileMetaSearch(parent, name)
		} else {
			return FileMetaSearch(parent, page, document)
		}
	} else if (node.type === 'DOCUMENT') {
		const name = node
		if (!page) {
			throw Error('DOCUMENT is null')
		}
		return { page, document: name }
	}
	return undefined
}

/**
 * 컴포넌트 최상단 페이지, 세션 찾기 없으면 undefined
 * @param node
 * @param section
 * @returns
 */
export const SectionSearch = (
	node: BaseNode,
	section?: SectionNode,
	page?: PageNode
): { page: PageNode; section?: SectionNode } => {
	const parent = node.parent

	if (parent && parent?.type !== 'DOCUMENT') {
		if (parent.type === 'SECTION') {
			return SectionSearch(parent, parent)
		} else {
			return SectionSearch(parent, section, page ?? figma.currentPage)
		}
	} else if (node.type === 'PAGE') {
		return { page: page ?? figma.currentPage, section }
	}
	return { page: page ?? figma.currentPage, section }
}

/**
 * 선택된 노드 상위에 path 역할을 수행할 수 있는 이름을 전체 조회
 * @param node
 * @param section
 * @returns
 */
export const FilePathSearch = (node: BaseNode, pathNode: PathNodeInfo[] = []): PathNodeInfo[] => {
	const parent = node.parent

	if (parent != null) {
		if (pathNodeType.includes(parent.type as PathNodeInfo['type'])) {
			// 맞으면 추가
			pathNode.push({
				type: parent.type as PathNodeInfo['type'],
				name: parent.name,
			})
			/**
			 * 저장 다했으니 순회 종료
			 * 텍스트 순서 맞춰주는 목적으로 reverse 함
			 */
			if (parent.type === 'DOCUMENT') {
				return pathNode.reverse()
			}
			return FilePathSearch(parent, pathNode)
		} else {
			// 아니면 그냥 진행
			return FilePathSearch(parent, pathNode)
		}
	}

	return pathNode
}

/**
 * 시작 노드를 저장
 * 현재 노드 포함, 노드 참조 객체 살려서
 * 주소로 쓸 수 있는 대상 조회
 * 도큐먼트는 쓸 일 없으니까 그냥 안씀
 * @param node
 * @param section
 * @returns
 */
export const FilePathNodeSearch = (node: BaseNode, pathNode: BaseNode[] = []): BaseNode[] => {
	if (linkPathNodeType.includes(node.type as (typeof linkPathNodeType)[number])) {
		pathNode.push(node)
	} else if (pathNode.length === 0) {
		// 처음 노드 저장
		pathNode.push(node)
	}
	const parent = node.parent
	if (parent != null) {
		// 위에 올 수록 앞에 오게 처리
		if (parent.type === 'DOCUMENT') {
			return pathNode.reverse()
		}
		return FilePathNodeSearch(parent, pathNode)
	}

	return pathNode
}

import type { Prettify } from '../../types/utilType'

export const notify = (message: string, closeLabel: string, timeout = 2000) => {
	if (typeof figma === 'object') {
		const NotificationHandler = figma.notify(message, {
			timeout: timeout,
			button: {
				text: closeLabel,
				action: () => {
					NotificationHandler.cancel()
				},
			},
		})
	}
}

const notifyMap = {} as Record<string, number>
/** progress 생성 */
export const figmaProgress = (name: string, reset?: boolean) => {
	if (reset) {
		notifyMap[name] = 0
	}
	if (notifyMap[name] == null) {
		notifyMap[name] = 0
	}
	notifyMap[name] += 1
	notify(name, String(notifyMap[name]), 1000)
}

/** 인스턴스의 컴포넌트를 반환 */
export async function findMainComponent(instance: InstanceNode) {
	while (instance.type === 'INSTANCE') {
		const main = await instance.getMainComponentAsync()
		if (main) {
			return main
		}
		return null // 메인 컴포넌트를 찾지 못한 경우
	}
}

type 참조 = Prettify<BaseNodeMixin>

export interface RecursiveFigmaNode<T extends BaseNode['type']> extends BaseNodeMixin {
	type: T
	children: RecursiveFigmaNode<T>[]
}

// baseNode 사용 시 전체 키
// id: asdf,
// parent: asdf,
// name: "asdf",
// removed: asdf,
// remove: asdf,
// setRelaunchData: asdf,
// getRelaunchData: asdf,
// isAsset: asdf,
// getCSSAsync: asdf,
// getPluginData: asdf,
// setPluginData: asdf,
// getPluginDataKeys: asdf,
// getSharedPluginData: asdf,
// setSharedPluginData: asdf,
// getSharedPluginDataKeys: asdf,
// getDevResourcesAsync: asdf,
// addDevResourceAsync: asdf,
// editDevResourceAsync: asdf,
// deleteDevResourceAsync: asdf,
// setDevResourcePreviewAsync: asdf,

// type TestNode = Prettify<BaseNodeMixin>;
const _temp: TestNode = null as any

type TestNode = Prettify<BaseNodeMixin>

type PathNodeInfo = {
	type: PageNode['type'] | DocumentNode['type'] | ComponentSetNode['type'] | ComponentNode['type'] | SectionNode['type']
	name: string
}

export const pathNodeType = ['DOCUMENT', 'PAGE', 'SECTION', 'COMPONENT_SET', 'COMPONENT'] as const
export const linkPathNodeType = ['DOCUMENT', 'PAGE', 'SECTION'] as const

export type FilterType = {
	DOCUMENT: boolean
	PAGE: boolean
	SECTION: boolean
	COMPONENT_SET: boolean
	COMPONENT: boolean
}

// 노드로 해야하나..
export const FilterTypeIndex = (text: string) => {
	if (text === 'DOCUMENT') {
		return 1
	}
	if (text === 'PAGE') {
		return 2
	}
	if (text === 'SECTION') {
		return 3
	}
	if (text === 'COMPONENT_SET') {
		return 4
	}
	if (text === 'COMPONENT') {
		return 5
	}
	return 0
}
