import { signal } from '@preact/signals-core'
import type { MetaData } from '@/domain/Search/searchStore'
import type { ValidAllStyleRangesType } from '@/figmaPluginUtils/text'
import type {
  CurrentCursorType,
  CurrentNode,
  DomainSettingType,
  LocalizationKey,
  LocalizationKeyDTO,
  StyleSync,
} from './types'

/**
 * 번역 키 관련 상태를 저장하는 시그널
 **/
export const localizationKeySignal = signal<LocalizationKey | null>(null)

/** 배치 처리 시 피그마 노드의 패턴 매칭 데이터 */
// export const patternMatchDataSignal = signal<SearchNodeData[]>([]);
export const patternMatchDataSignal = signal<MetaData[]>([])

/** 배치 처리를 위한 선택된 아이디 배열 */
export const selectIdsSignal = signal<string[]>([])

/**
 * 클라이언트 측에서 관리되는
 * 선택된 섹션 타겟
 * 선택 로직에 의해 선택 된 것으로
 */
/** 현재 커서가 있는 섹션 ( 실시간 감지 ) */
export const currentSectionSignal = signal<CurrentNode | null>(null)

/** 현재 포인터의 노드 데이터 */
export const currentPointerSignal = signal<CurrentCursorType | null>(null)

/** 프로젝트 아이디 */
export const projectIdSignal = signal<string>('')

/** 선택된 섹션 키 */
export const selectedKeySignal = signal<string | null>(null)
export const selectedKeyDataSignal = signal<LocalizationKeyDTO | null>(null)
/** 입력된 키 값 */
export const inputKeySignal = signal<string>('')

/** 즉시 처리 여부 */
export const isDirectSignal = signal<boolean>(false)
/** 추정 일괄 처리 여부 */
export const isTravelSignal = signal<boolean>(false)

/** 스타일 저장소 */
export const styleSignal = signal<StyleStore>({})

/** 스타일 태그 네이밍 값 결정 모드 */
export const styleTagModeSignal = signal<'name' | 'id'>('id')

/** 도메인 설정 */
export const domainSettingSignal = signal<DomainSettingType | null>(null)

/** 언어 코드 배열 */
export const languageCodesSignal = signal<string[]>([])
export type StyleStore = Record<string, StyleSync>

export type StyleData = {
  styleData: ValidAllStyleRangesType
  boundVariables: any
  effectStyleData: any
}

export const styleDataSignal = signal<StyleData | null>(null)
export const variableDataSignal = signal<Record<string, string>>({})

export const userHashSignal = signal<string | null>(null)
// elwkdlsj
// 디자이너라 씀
