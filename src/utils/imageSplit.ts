import { LLog } from './console'

const selectType = ['SLICE']

/** SLICE 찾는 코드 */
export function* sliceDeepTraverse(
  node: BaseNode,
  path = 'select'
): IterableIterator<Rect> {
  // 현재 노드 방문
  if (selectType.includes(node.type)) {
    const data = (node as SliceNode).absoluteBoundingBox
    LLog('svg', node)

    if (data) yield data
  }
  // 자식 노드가 존재하는 경우
  if ('children' in node && node.children && node.children.length) {
    // 자식 노드를 재귀적으로 탐색
    for (let i = 0; i < node.children.length; i++) {
      yield* sliceDeepTraverse(node.children[i], path + ':' + i)
    }
  }
}
