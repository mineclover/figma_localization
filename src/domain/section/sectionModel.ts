import { signal } from '@preact/signals-core'
import { Section, SectionList, MEMO_KEY, CurrentSectionInfo, FocusModeType } from '../types'

/**
 * 섹션 아이디 리스트 조회
 * 아이디에서 메모 아이디로 메모 조회
 * 섹션 키 기반으로 전체 메모들이 저장되어있는 걸 가지고 있음
 * 조회를 줄여야하면 일단 이름으로 필터링하고
 * 섹션 아톰 역할은?
 * 전체 섹션 리스트 저장하기
 *
 */

export const sectionAtom = signal<Section>({})
export const sectionListAtom = signal<SectionList>([])
/**
 * 핫토픽은 섹션과 구조가 같으나 처리 로직이 다름
 * 시간을 기준으로 섹션이 정렬되고
 * 기존 메모를 핫토픽에도 복제해서 보여주는 개념으로 동작
 */

export const hotTopicListAtom = signal<MEMO_KEY[]>([])

/**
 * 현재 섹션 정보
 * currentSection
 * */
export const currentSectionAtom = signal<CurrentSectionInfo[]>([])

export const currentSectionFocusAtom = signal<FocusModeType>('section')
