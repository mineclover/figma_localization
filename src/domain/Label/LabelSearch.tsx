import {
  Bold,
  Code,
  IconButton,
  IconChevronDown24,
  IconChevronUp24,
  IconLockLocked16,
  IconLockUnlocked16,
  IconStar16,
  SearchTextbox,
  Text,
  Toggle,
  VerticalSpace,
} from '@create-figma-plugin/ui'
import { emit } from '@create-figma-plugin/utilities'
import { Fragment } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import { clc } from '@/components/modal/utils'
import { useFetch } from '@/hooks/useFetch'
import { useSignal } from '@/hooks/useSignal'
import {
  currentPointerSignal,
  domainSettingSignal,
  isDirectSignal,
  isTravelSignal,
  selectedKeyDataSignal,
  selectedKeySignal,
} from '@/model/signal'
import type { LocalizationKeyDTO } from '@/model/types'
import { UPDATE_NODE_STORE_KEY } from '../constant'
import styles from './LabelPage.module.css'

export const NullDisableText = ({
  className,
  placeholder,
  children,
}: {
  className?: string
  placeholder?: string
  children?: React.ReactNode
}) => {
  return (
    <span className={clc(className, children == null && styles.textDisabled)}>
      {children == null ? placeholder : children}
    </span>
  )
}
const _nameOrAliasIcon = (isNameOpen: boolean, is_temporary: number) => {
  if (isNameOpen) {
    return is_temporary === 1 ? <IconLockUnlocked16 /> : <IconLockLocked16 />
  }
  return <IconStar16 />
}

const SearchResultItem = ({
  key_id,
  name,
  section_name,
  alias,
  is_temporary,
  origin_value,
  searchHandler,
}: LocalizationKeyDTO & {
  searchHandler: (key: string) => void
}) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div
      className={clc(
        styles.searchResultItem,
        selectedKeySignal.value === key_id.toString() && styles.searchResultItemSelected,
      )}
      key={key_id}
      onClick={() => {
        selectedKeySignal.value = key_id.toString()
        searchHandler(name)
      }}
    >
      <div className={styles.searchResultTop}>
        <NullDisableText className={styles.searchResultName} placeholder="원본 값 없음">
          <Code>text : {origin_value ?? ''}</Code>
        </NullDisableText>
        {/* {<IconButton>{is_temporary === 1 ? <IconLockUnlocked16 /> : <IconLockLocked16 />}</IconButton>} */}

        <NullDisableText className={styles.searchSectionTagBox} placeholder="key">
          <Code>#{key_id}</Code>
        </NullDisableText>
      </div>
      <div className={styles.searchResultBottom}>
        <NullDisableText className={styles.searchResultName} placeholder="이름 없음">
          <Bold>key : {name}</Bold>
        </NullDisableText>
        <IconButton onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <IconChevronUp24 /> : <IconChevronDown24 />}
        </IconButton>
        {/* <IconButton
					// className={styles.searchResultSubmitButton}
					onClick={() => emit(UPDATE_NODE_STORE_KEY.REQUEST_KEY, key_id)}
				>
					<IconPlus24></IconPlus24>
				</IconButton> */}
      </div>
    </div>
  )
}

export const SearchArea = ({
  search,

  data,
  searchHandler,
}: {
  search: string

  data: LocalizationKeyDTO[]
  searchHandler: (key: string) => void
}) => {
  return (
    <Fragment>
      <VerticalSpace space="extraSmall"></VerticalSpace>
      <SearchTextbox
        key={'searchTextbox'}
        placeholder="Search..."
        value={search}
        onChange={(e) => {
          searchHandler(e.currentTarget.value)
          // setSearch(keyConventionRegex(e.currentTarget.value))
        }}
      ></SearchTextbox>
      <VerticalSpace space="extraSmall"></VerticalSpace>
      <div className={styles.searchResult}>
        {data?.map((item) => (
          <SearchResultItem {...item} searchHandler={searchHandler} />
        ))}
      </div>
    </Fragment>
  )
}

export const useSearch = () => {
  const [search, setSearch] = useState('')
  const { data, loading, error, fetchData } = useFetch<LocalizationKeyDTO[]>()
  const domainSetting = useSignal(domainSettingSignal)
  const selectedKey = useSignal(selectedKeySignal)

  useEffect(() => {
    const tempData = data?.find((item) => item.key_id.toString() === (selectedKey ?? '0'))
    if (tempData) {
      selectedKeyDataSignal.value = tempData
    }
  }, [data])

  useEffect(() => {
    if (loading) {
      return
    }
    const domainId = domainSetting?.domainId

    if (!domainId) {
      return
    }
    if (search.length === 0) {
      return
    }

    fetchData(`/localization/keys/name/${search}` as '/localization/keys/name/{name}', {
      method: 'GET',
      headers: {
        'X-Domain-Id': domainId.toString(),
        'Content-Type': 'application/json',
      },
    })
    return () => {
      selectedKeySignal.value = null
    }
  }, [search])

  return { search, setSearch, data, loading, error, fetchData }
}

/** search bar */
function LabelSearch() {
  const { data, search, setSearch } = useSearch()

  const isBatch = useSignal(isDirectSignal)

  const _isTravel = useSignal(isTravelSignal)

  const currentPointer = useSignal(currentPointerSignal)
  const selectedKey = useSignal(selectedKeySignal)
  const searchHandler = (key: string) => {
    setSearch(key)
  }

  // 즉시 적용 기능
  useEffect(() => {
    if (isBatch && selectedKey && currentPointer) {
      emit(UPDATE_NODE_STORE_KEY.REQUEST_KEY, selectedKey)
    }
  }, [currentPointer?.nodeId])

  return (
    <Fragment>
      {/* <Toggle onChange={() => setIsTravel(!isTravel)} value={isTravel}>
			<Text>유사 패턴 탐색 (등록 시 유사 패턴 일괄 적용)</Text>
		</Toggle> */}
      <VerticalSpace space="extraSmall"></VerticalSpace>

      <Toggle onChange={() => (isDirectSignal.value = !isBatch)} value={isBatch}>
        <Text>즉시 적용 (alt + click 추천)</Text>
        <VerticalSpace space="extraSmall"></VerticalSpace>
        <Text>검색 창에서 선택된 상태로 피그마 텍스트 클릭 시 반영</Text>
      </Toggle>
      <SearchArea search={search} data={data ?? []} searchHandler={searchHandler} />
    </Fragment>
  )
}
export default LabelSearch
