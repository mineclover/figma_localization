import {
  Bold,
  Button,
  IconButton,
  IconPrototyping24,
  IconTrash24,
  Muted,
  Text,
  TextboxMultiline,
  Toggle,
  VerticalSpace,
} from '@create-figma-plugin/ui'
import { emit } from '@create-figma-plugin/utilities'
import { signal } from '@preact/signals-core'
import { Suspense, type TargetedEvent } from 'preact/compat'
import { useEffect, useState } from 'preact/hooks'
import { modalAlert } from '@/components/alert'
import { pageNodeZoomAction } from '@/figmaPluginUtils/utilAction'
import { useSignal } from '@/hooks/useSignal'
import {
  currentPointerSignal,
  domainSettingSignal,
  languageCodesSignal,
  type StyleData,
  styleDataSignal,
  styleTagModeSignal,
} from '@/model/signal'
import type { StyleSync } from '@/model/types'
import { removeLeadingSymbols } from '@/utils/textTools'
import { isXmlCheck } from '@/utils/xml'
import { replaceTagNames, unwrapTag, wrapTextWithTag } from '@/utils/xml2'
import { DOWNLOAD_STYLE, SET_NODE_ACTION, SET_NODE_RESET_KEY, SET_PAGE_LOCK_OPEN } from '../constant'
import styles from '../Label/LabelPage.module.css'
import { type ActionType, actionTypes } from '../System/ActionResourceDTO'
import TranslateLine from '../Translate/TranslateLine'
import { clientFetchDBCurry } from '../utils/fetchDB'
import { styleToXml, xmlToStyle } from './styleAction'
import { ErrorBoundary, ResourceProvider } from './suspense'
import Tags, { extractSelectedItems, tagsSignal } from './Tags'

type CurrentMetadata = {
  nodeId?: string
  name: string
  localizationKey?: string
  originalLocalizeId?: string
  domainValid: boolean
}

const MetadataBlock = ({ nodeId, name, localizationKey, originalLocalizeId, domainValid }: CurrentMetadata) => {
  const currentPointer = useSignal(currentPointerSignal)
  const _action = currentPointer?.data.action ?? 'default'
  const _options = Object.entries(actionTypes).map(([_key, value]) => ({ value: value }))

  const _handleChange = (event: TargetedEvent<HTMLInputElement, Event>) => {
    const next = event.currentTarget.value as ActionType
    emit(SET_NODE_ACTION.REQUEST_KEY, {
      action: next,
    })
  }

  return (
    <div className={styles.metadataContainer}>
      <VerticalSpace space="extraSmall" />
      <div className={styles.labelRow}>
        <Text>NAME: {name}</Text>
        <Muted>#{localizationKey}</Muted>
        <IconButton
          onClick={() => {
            if (nodeId) {
              emit(SET_NODE_RESET_KEY.REQUEST_KEY)
            }
          }}
        >
          <IconTrash24 />
        </IconButton>
      </div>
      <div className={styles.labelRow}>
        <Text>ID: {nodeId}</Text>
        <IconButton
          onClick={() => {
            if (nodeId) {
              pageNodeZoomAction(nodeId)
            }
          }}
        >
          <IconPrototyping24></IconPrototyping24>
        </IconButton>
      </div>

      {domainValid ? null : <Text className={styles.dangerText}>도메인이 다르거나 없음</Text>}
    </div>
  )
}

export const StyleXml = ({
  resource,
  focusUpdateCount,
}: {
  resource: {
    read: () => {
      xmlString: string
      styleStoreArray: StyleSync[]
      effectStyle: Omit<StyleSync, 'ranges'> | null
    }
  }
  focusUpdateCount: number
}) => {
  const { xmlString, styleStoreArray: styleValues, effectStyle } = resource.read()

  // br로 할지 br로 할지 결정되지 않음
  // 안정적인 건 br긴 함
  const brString = xmlString.replace(/\n/g, '<br/>')
  const _styleTagMode = useSignal(styleTagModeSignal)
  const currentPointer = useSignal(currentPointerSignal)
  const isKeySetting = currentPointer && currentPointer.data.localizationKey !== ''
  const action = currentPointer?.data.action ?? 'default'
  const [resultXml, setResultXml] = useState<string>(brString)
  const tags = useSignal<Record<string, string>>(tagsSignal)

  const changeXml = async () => {
    let result = brString
    for (const [key, value] of Object.entries(tags)) {
      if (value !== '') {
        result = await replaceTagNames(result, key, value)
      }
    }
    const result1 = await unwrapTag(result)
    const result2 = await wrapTextWithTag(result1)

    console.log('🚀 ~ 무결성 검사 : ', result === result2)
    const brString2 = result1.replace(/\n/g, '<br/>')

    setResultXml(brString2)
  }

  useEffect(() => {
    changeXml()
  }, [brString, tags])

  return (
    <div>
      <VerticalSpace space="small" />

      <div className={styles.searchResultTop}>
        <Text>피그마 저장 결과 미리보기:</Text>
        <TranslateLine characters={resultXml}></TranslateLine>
      </div>
      <VerticalSpace space="small" />
      <TextboxMultiline value={resultXml} placeholder="XML 출력" />
      <VerticalSpace space="small" />

      {/* 조회도 해야하고 변환도 해야하고 */}
      {/* <ResourceProvider fetchFn={} >
					{(resource) => (
						<Suspense fallback={<div className="loading">데이터를 불러오는 중...</div>}>
						
						</Suspense>
					)}
				</ResourceProvider> */}
      <Tags
        localizationKey={currentPointer?.data.localizationKey ?? ''}
        xmlString={brString}
        action={currentPointer?.data.action ?? 'default'}
      />

      {isKeySetting ? (
        <Button
          onClick={async () => {
            // 메타데이터 저장
            emit(SET_NODE_ACTION.REQUEST_KEY, {
              localizationKey: currentPointer?.data.localizationKey,
              action: action,
              domainId: currentPointer?.data.domainId,
            })
            const fetchClient = clientFetchDBCurry(currentPointer?.data.domainId)

            const fetchData2 = await fetchClient('/localization/translations', {
              method: 'PUT',
              body: JSON.stringify({
                keyId: currentPointer?.data.localizationKey,
                language: 'origin',
                translation: resultXml,
              }),
            })

            const data2 = await fetchData2.json()
            console.log('🚀 ~ 업로드 됨', data2)
            const selected = extractSelectedItems(tags)

            const body = {
              key_id: currentPointer?.data.localizationKey,
              action: action,
              mappings: selected,
            }
            console.log('🚀 ~ onClick={ ~ body:', body)

            const fetchData = await fetchClient('/localization/actions/bulk', {
              method: 'POST',
              body: JSON.stringify(body),
            })
            const data = await fetchData.json()
            modalAlert(
              <div>
                <Text>{data.success ? '성공' : '실패'}</Text>
                <Text>{data.message}</Text>
              </div>,
            )

            // 키, 액션, xml 로 저장
            // 키, 액션, 태그 이름, a,b 로 저장
          }}
        >
          Save
        </Button>
      ) : (
        <div className={styles.padding}>
          <Bold>로컬라이제이션 키 없음</Bold>
        </div>
      )}
    </div>
  )
}

export const focusUpdateCountSignal = signal(0)

const StylePage = () => {
  /** 도메인에 설정된 리스트 */
  const languageCodes = useSignal(languageCodesSignal)
  const currentPointer = useSignal(currentPointerSignal)
  console.log('🚀 ~ currentPointer:', currentPointer?.pageLock)

  const styleTagMode = useSignal(styleTagModeSignal)
  const styleData = useSignal(styleDataSignal)
  const focusUpdateCount = useSignal(focusUpdateCountSignal)
  const domainSetting = useSignal(domainSettingSignal)

  // const localizationKeyValue = useSignal(localizationKeySignal);
  // const pageLock = currentPointer?.pageLock ?? false;

  const targetArray = ['origin', ...languageCodes]
  const action = currentPointer?.data.action ?? 'default'
  const isStyle = currentPointer

  const currentMetadata = {
    nodeId: currentPointer?.nodeId,
    name: currentPointer?.nodeName ? removeLeadingSymbols(currentPointer?.nodeName) : '',
    localizationKey: currentPointer?.data.localizationKey,

    domainValid: currentPointer?.data.domainId === domainSetting?.domainId,
  }

  if (currentPointer && styleData && domainSetting?.domainId) {
    return (
      <div>
        <MetadataBlock {...currentMetadata} />
        <VerticalSpace space="extraSmall" />
        <Toggle
          value={currentPointer?.pageLock ?? false}
          onChange={(e) => {
            emit(SET_PAGE_LOCK_OPEN.REQUEST_KEY, e.currentTarget.checked)
          }}
        >
          <Text>페이지 잠금</Text>
        </Toggle>

        <VerticalSpace space="small" />

        <div className={styles.container}>
          <Bold>다운로드 선택</Bold>
          <div className={styles.rowContainer}>
            {isStyle &&
              targetArray.map((item) => {
                return (
                  <Button
                    key={item}
                    onClick={() => {
                      emit(DOWNLOAD_STYLE.REQUEST_KEY, {
                        localizationKey: currentPointer.data.localizationKey,
                        lang: item,
                      })
                      focusUpdateCountSignal.value = focusUpdateCount + 1
                    }}
                  >
                    {item}
                  </Button>
                )
              })}
          </div>
        </div>
        <VerticalSpace space="small" />

        <VerticalSpace space="small" />
        <Text>{(domainSetting.domainId, currentPointer.characters, styleData)}</Text>

        <ErrorBoundary>
          <ResourceProvider
            fetchFn={async ({
              domainId,
              characters,
              StyleDataArr,
              mode,
            }: {
              domainId: number
              characters: string
              StyleDataArr: StyleData
              mode: 'id' | 'name'
            }) => {
              if (isXmlCheck(characters)) {
                console.log('🚀 ~ fetchFn={ ~ characters:', characters)
                return xmlToStyle(characters, currentPointer.data.localizationKey, action)
              } else {
                return styleToXml(domainId, characters, StyleDataArr, mode)
              }
            }}
            domainId={domainSetting.domainId}
            characters={currentPointer.characters}
            StyleDataArr={styleData}
            mode={styleTagMode}
            focusUpdateCount={focusUpdateCount}
          >
            {(resource) => {
              return (
                <Suspense fallback={<div className="loading">데이터를 불러오는 중...</div>}>
                  <StyleXml resource={resource} focusUpdateCount={focusUpdateCount} />
                </Suspense>
              )
            }}
          </ResourceProvider>
        </ErrorBoundary>
      </div>
    )
  }
}
export default StylePage
