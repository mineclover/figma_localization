import { on } from '@create-figma-plugin/utilities'
import { generatePastelColors, hexToRGBA } from '@/utils/color'
import { type MetaData, searchStore } from './searchStore'

export const RENDER_PAIR = {
  RENDER_REQUEST: 'RENDER_REQUEST',
  RENDER_RESPONSE: 'RENDER_RESPONSE',
}

export const DISABLE_RENDER_PAIR = {
  DISABLE_RENDER_REQUEST: 'DISABLE_RENDER_REQUEST',
  DISABLE_RENDER_RESPONSE: 'DISABLE_RENDER_RESPONSE',
}

export const BACKGROUND_SYMBOL = {
  background: 'IS_BACKGROUND',
  idStore: 'BACKGROUND_ID_STORE',
}

export const getBackgroundSize = () => {
  const nodes = figma.currentPage.children
  const padding = 100

  const minmax = nodes.reduce(
    (acc, node) => {
      if (node.name === '##overlay') {
        return acc
      }
      if (node && 'absoluteBoundingBox' in node && node.absoluteBoundingBox) {
        const { x, y, width, height } = node.absoluteBoundingBox
        return {
          x: Math.min(acc.x, x),
          y: Math.min(acc.y, y),
          right: Math.max(acc.right, x + width), // Store rightmost instead of width
          bottom: Math.max(acc.bottom, y + height), // Store bottommost instead of height
        }
      }
      return acc
    },
    { x: Infinity, y: Infinity, right: -Infinity, bottom: -Infinity },
  )

  // Calculate the actual dimensions with margin
  const actualWidth = minmax.right - minmax.x
  const actualHeight = minmax.bottom - minmax.y

  return {
    x: minmax.x - padding,
    y: minmax.y - padding,
    width: actualWidth + padding * 2,
    height: actualHeight + padding * 2,
  }
}

const getBackgroundFrame = () => {
  const nodes = figma.currentPage.children
  for (const node of nodes) {
    if (node.name === '##overlay') {
      if (node.getPluginData(BACKGROUND_SYMBOL.background) === 'true') {
        return node as FrameNode
      }
    }
  }
  return figma.createFrame()
}

const keySplit = (data: MetaData[]) => {
  const hasKey = data.reduce(
    (acc, node) => {
      if (node.localizationKey !== '') {
        acc.hasKey.push(node)
        acc.keys.add(node.localizationKey)
      } else {
        acc.nullKey.push(node)
      }

      return acc
    },
    {
      hasKey: [] as MetaData[],
      nullKey: [] as MetaData[],
      keys: new Set<string>(),
    },
  )
  return {
    /**
     * 키 있는 데이터
     */
    hasKey: hasKey.hasKey,
    /**
     * 키 없는 데이터
     */
    nullKey: hasKey.nullKey,
    /**
     * 키 목록
     */
    keys: Array.from(hasKey.keys),
  }
}

const clearBackground = (frame: FrameNode, data: MetaData[]) => {
  const nodes = frame.children
  const idStore = data.map((item) => item.id)
  const idSet = new Set(idStore)
  const removeTarget = nodes.filter((node) => idSet.has(node.getPluginData(BACKGROUND_SYMBOL.idStore)))
  for (const node of removeTarget) {
    node.remove()
  }
}

const textOverlay = (
  data: MetaData,
  colorMap: Record<string, string>,
  frame: FrameNode,
  position: { x: number; y: number },
) => {
  const padding = 10
  const { x: rootX, y: rootY } = position

  const { x, y, width, height, localizationKey, id } = data
  const node = figma.createFrame()

  node.resize(width + padding * 2, height + padding * 2)
  const color = colorMap[localizationKey] ?? '#ffffff'

  const rgba = hexToRGBA(color)
  const paint = figma.util.solidPaint(rgba)
  node.fills = [paint]
  node.name = `#${localizationKey}`
  node.setPluginData(BACKGROUND_SYMBOL.background, 'true')
  frame.appendChild(node)
  node.setPluginData(BACKGROUND_SYMBOL.idStore, id)
  // node.blendMode = 'OVERLAY';
  node.blendMode = 'HARD_LIGHT'

  node.strokes = [figma.util.solidPaint({ r: 0, g: 0, b: 0 })]
  node.strokeWeight = 1
  node.strokeMiterLimit = 10
  node.strokeJoin = 'ROUND'
  node.strokeCap = 'ROUND'
  node.strokeAlign = 'CENTER'
  node.dashPattern = [2, 4]

  node.x = x - rootX - padding
  node.y = y - rootY - padding

  return node
}

export const onRender = () => {
  on(RENDER_PAIR.RENDER_REQUEST, async () => {
    const backgroundSize = getBackgroundSize()

    const frame = getBackgroundFrame()
    const nodes = await searchStore.search()
    // 전체 스토어 초기화
    clearBackground(frame, nodes)

    const { hasKey, nullKey, keys } = keySplit(nodes)

    const optionColorMap = generatePastelColors(keys, 40)

    const { x, y, width, height } = backgroundSize
    frame.x = x
    frame.y = y
    frame.resize(width, height)
    const paint = figma.util.solidPaint({ r: 0, g: 0, b: 0, a: 0.4 })

    frame.fills = [paint]

    frame.opacity = 0.7
    frame.locked = true
    frame.name = '##overlay'
    frame.setPluginData(BACKGROUND_SYMBOL.background, 'true')

    hasKey.forEach((item, index) => {
      // 시작 대상 포커스 해도 됨

      const node = textOverlay(item, optionColorMap, frame, { x, y })
      // if (0 === index) {
      // 	figma.currentPage.selection = [node];
      // 	figma.viewport.scrollAndZoomIntoView([node]);
      // }
      // 마지막 대상 포커스 ?
      if (hasKey.length - 1 === index) {
        figma.currentPage.selection = [node]
        figma.viewport.scrollAndZoomIntoView([node])
      }
    })
    nullKey.forEach((item) => {
      const _node = textOverlay(item, optionColorMap, frame, { x, y })
    })
  })
}

export const onDisableRender = () => {
  on(DISABLE_RENDER_PAIR.DISABLE_RENDER_REQUEST, async () => {
    const frame = getBackgroundFrame()
    frame.remove()
  })
}
