import { emit, on } from '@create-figma-plugin/utilities'
import { FilePathNodeSearch } from '@/figmaPluginUtils'
import { currentSectionSignal, variableDataSignal } from '@/model/signal'
import type { CurrentNode, LocalizationTranslationDTO } from '@/model/types'
import { CacheStore } from '@/utils/cacheStore'
import {
  CHANGE_LANGUAGE_CODE,
  CLEAR_VARIABLE_DATA,
  CURRENT_SECTION_SELECTED,
  GET_VARIABLE_DATA,
  NODE_STORE_KEY,
  SET_VARIABLE_DATA,
  VARIABLE_PREFIX,
} from '../constant'
import { TargetNodeStyleUpdate } from '../Style/styleAction'
import { processReceiver } from '../System/process'
import { fetchDB } from '../utils/fetchDB'

export const onCurrentSectionSelectedResponse = () => {
  emit(CURRENT_SECTION_SELECTED.REQUEST_KEY)
  return on(CURRENT_SECTION_SELECTED.RESPONSE_KEY, (section: CurrentNode) => {
    currentSectionSignal.value = section
  })
}

/**
 * 선택 기능으로 선택을 제어하려 할 때는 트리거 온오프로 상태 업데이트를 제어하는 방식으로 구성
 * @param node
 * @returns
 */
export const getCurrentSectionSelected = (node: BaseNode) => {
  if (node && node.type === 'SECTION') {
    return {
      id: node.id,
      name: node.name,
    }
  }

  if (node) {
    const result = FilePathNodeSearch(node)
    const sectionNode = result.find((node) => node.type === 'SECTION')

    if (sectionNode) {
      return {
        id: sectionNode.id,
        name: sectionNode.name,
      }
    }
  }

  return null
}
export const onCurrentSectionSelected = () => {
  on(CURRENT_SECTION_SELECTED.REQUEST_KEY, () => {
    const section = getCurrentSectionSelected(figma.currentPage.selection[0])
    if (section) {
      emit(CURRENT_SECTION_SELECTED.RESPONSE_KEY, section)
    }
  })
}

interface TranslationResponse {
  success: boolean
  data?: LocalizationTranslationDTO
  error?: string
}

// 번역 코드 검색 결과를 위한 캐시 저장소
const translationCodeCache = new CacheStore<TranslationResponse>({ ttl: 5000 })

// 키와 언어 코드로 번역 데이터 조회해서 1개 받음
export const searchTranslationCode = async (key: string, code: string, _date?: number) => {
  const apiPath = `/localization/translations/search?keyId=${key}&language=${code}`
  const cacheKey = apiPath
  const cachedItem = translationCodeCache.get(cacheKey)

  if (cachedItem) {
    console.log(`캐시된 번역 코드 데이터 반환: ${cacheKey}`)
    return cachedItem.data
  }

  try {
    const result = await fetchDB(
      `/localization/translations/search?keyId=${key}&language=${code}` as '/localization/translations/search',
      {
        method: 'GET',
      },
    )

    if (!result || result.status !== 200) {
      const response: TranslationResponse = {
        success: false,
        error: '번역 데이터를 가져오는데 실패했습니다.',
      }
      translationCodeCache.set(cacheKey, response)
      console.log('실패한 번역 코드 데이터 캐싱됨')
      return undefined
    }

    const data = (await result.json()) as LocalizationTranslationDTO
    const response: TranslationResponse = {
      success: true,
      data: data,
    }

    // 결과 캐싱
    translationCodeCache.set(cacheKey, response)
    console.log('번역 코드 데이터 캐싱 갱신 됨')

    return data
  } catch (error) {
    const response: TranslationResponse = {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
    }
    translationCodeCache.set(cacheKey, response)
    console.log('에러가 발생한 번역 코드 데이터 캐싱됨')
    return undefined
  }
}

/** 영역 내에 있는 모든 텍스트 노드의 로컬라이제이션 키를 찾아서 변경 */
export const changeLocalizationCode = async (sectionNode: SectionNode | PageNode, code: string) => {
  //인스턴스도 탐색해서 수정하기 위함
  figma.skipInvisibleInstanceChildren = false

  const arr = sectionNode.findAllWithCriteria({
    types: ['TEXT'],
    pluginData: {
      keys: [NODE_STORE_KEY.LOCALIZATION_KEY],
    },
  })

  const targetOrigin = new Map<string, Set<TextNode>>()

  //  map 말고 foreach 해도 될지도?
  /**
   * 현재 로컬라이제이션 키가 같은 노드들을 모아서 처리
   */
  const targetTextArr = arr
    .filter((item) => {
      const currentLocalizationKey = item.getPluginData(NODE_STORE_KEY.LOCALIZATION_KEY)
      if (currentLocalizationKey) {
        return true
      }
      return false
    })
    .map((item) => {
      const localizationKey = item.getPluginData(NODE_STORE_KEY.LOCALIZATION_KEY)

      if (localizationKey !== '') {
        let temp = targetOrigin.get(localizationKey)
        if (temp == null) {
          temp = new Set<TextNode>()
        }
        targetOrigin.set(localizationKey, temp.add(item))
      }
      return item
    })

  const now = Date.now()
  const id = `change target : ${code}`
  let count = 0
  processReceiver({
    process_id: id,
    process_name: code,
    process_status: count,
    process_end: targetTextArr.length,
  })

  for (const [key, targetNodes] of targetOrigin.entries()) {
    // key , code

    const a = await searchTranslationCode(key, code, now)

    // 번역 텍스트가 없으면 카운트 안됨
    if (a) {
      for (const node of targetNodes) {
        count++
        const localizationKey = node.getPluginData(NODE_STORE_KEY.LOCALIZATION_KEY)
        if (localizationKey) {
          await TargetNodeStyleUpdate(node, localizationKey, code, now)
        }
        processReceiver({
          process_id: id,
          process_name: code,
          process_status: count,
          process_end: targetTextArr.length,
        })
      }
    }
  }
}

/** 번역을 위한 언어 코드 설정 */
export const onSetLanguageCode = async () => {
  on(CHANGE_LANGUAGE_CODE.REQUEST_KEY, async (languageCode: string, sectionId?: string) => {
    let areaNode: SectionNode | PageNode | null = null
    if (sectionId) {
      areaNode = (await figma.getNodeByIdAsync(sectionId)) as SectionNode | null
    } else {
      areaNode = figma.currentPage
    }
    if (areaNode == null) {
      return
    }
    await changeLocalizationCode(areaNode, languageCode)
    getVariableData()
  })
}

/** 변수 데이터 조회 후 전송 */
export const getVariableData = () => {
  const data = figma.root.getPluginDataKeys()
  const variableData = data.filter((item) => item.startsWith(VARIABLE_PREFIX))

  const variableDataMap = {} as Record<string, string>
  variableData.map((item) => {
    const value = figma.root.getPluginData(item)
    const key = item.replace(VARIABLE_PREFIX, '')
    variableDataMap[key] = value
  })

  emit(GET_VARIABLE_DATA.RESPONSE_KEY, variableDataMap)
}

export const onGetVariableData = () => {
  on(GET_VARIABLE_DATA.REQUEST_KEY, getVariableData)
}

export const onGetVariableDataResponse = () => {
  emit(GET_VARIABLE_DATA.REQUEST_KEY)
  return on(GET_VARIABLE_DATA.RESPONSE_KEY, (data: Record<string, string>) => {
    variableDataSignal.value = data
  })
}

export const onSetVariableData = () => {
  on(SET_VARIABLE_DATA.REQUEST_KEY, (key: string, value: string) => {
    figma.root.setPluginData(VARIABLE_PREFIX + key.toUpperCase(), value)
    getVariableData()
  })
}

export const onClearVariableData = () => {
  on(CLEAR_VARIABLE_DATA.REQUEST_KEY, () => {
    const data = figma.root.getPluginDataKeys()
    const variableData = data.filter((item) => item.startsWith(VARIABLE_PREFIX))
    variableData.map((item) => {
      figma.root.setPluginData(item, '')
    })
    getVariableData()
  })
}
