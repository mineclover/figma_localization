import { Dropdown, IconChevronDown24, SearchTextbox } from '@create-figma-plugin/ui'
import { Fragment, h } from 'preact'
import type { NonNullableComponentTypeExtract } from 'types/utilType'
import type { SearchOption } from '../hooks/useSearchState'

interface SearchInputProps {
	searchValue: string
	setSearchValue: (value: string) => void
	searchOption: SearchOption
	setSearchOption: (option: SearchOption) => void
}

const searchOptions = [
	{ text: 'text', value: 'text' },
	{ text: 'name', value: 'name' },
	{ text: 'parentName', value: 'parentName' },
	{ text: 'localizationKey', value: 'localizationKey' },
]

export const SearchInput = ({ searchValue, setSearchValue, searchOption, setSearchOption }: SearchInputProps) => {
	const handleSearchChange = (
		event: Parameters<NonNullableComponentTypeExtract<typeof SearchTextbox, 'onInput'>>[0]
	) => {
		setSearchValue(event.currentTarget.value)
	}

	const handleOptionChange = (event: Parameters<NonNullableComponentTypeExtract<typeof Dropdown, 'onChange'>>[0]) => {
		setSearchOption(event.currentTarget.value as SearchOption)
	}

	return (
		<Fragment>
			<SearchTextbox onInput={handleSearchChange} placeholder="Search..." value={searchValue} />
			<Dropdown
				icon={<IconChevronDown24 />}
				onChange={handleOptionChange}
				options={searchOptions}
				value={searchOption}
			/>
		</Fragment>
	)
}
