import { useState } from 'preact/hooks'
export type SearchOption = 'text' | 'name' | 'parentName' | 'localizationKey'
export type GroupOptionType = 'localizationKey' | 'parentName' | 'text'
export type ViewOptionType = 'list' | 'group'

export const useSearchState = () => {
	const [searchOption, setSearchOption] = useState<SearchOption>('text')
	const [searchValue, setSearchValue] = useState<string>('')
	const [openOption, setOpenOption] = useState<boolean>(false)
	const [allView, setAllView] = useState<boolean>(true)

	return {
		searchOption,
		setSearchOption,
		searchValue,
		setSearchValue,
		openOption,
		setOpenOption,
		allView,
		setAllView,
	}
}

export const useGroupViewOptions = () => {
	const groupOptions = [
		{ text: 'localizationKey', value: 'localizationKey' },
		{ text: 'parentName', value: 'parentName' },
		{ text: 'text', value: 'text' },
	]

	const viewOptions = [
		{ text: 'list', value: 'list' },
		{ text: 'group', value: 'group' },
	]

	const [groupOption, setGroupOption] = useState<GroupOptionType>('localizationKey')
	const [viewOption, setViewOption] = useState<ViewOptionType>('group')

	return {
		groupOptions,
		viewOptions,
		groupOption,
		setGroupOption,
		viewOption,
		setViewOption,
	}
}
