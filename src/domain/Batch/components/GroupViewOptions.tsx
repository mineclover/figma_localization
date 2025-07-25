import { Dropdown, IconChevronDown24 } from '@create-figma-plugin/ui'
import { Fragment, h } from 'preact'
import type { NonNullableComponentTypeExtract } from 'types/utilType'
import type { GroupOptionType, ViewOptionType } from '../hooks/useSearchState'

interface GroupViewOptionsProps {
	groupOption: GroupOptionType
	setGroupOption: (option: GroupOptionType) => void
	viewOption: ViewOptionType
	setViewOption: (option: ViewOptionType) => void
	groupOptions: Array<{ text: string; value: string }>
	viewOptions: Array<{ text: string; value: string }>
}

export const GroupViewOptions = ({
	groupOption,
	setGroupOption,
	viewOption,
	setViewOption,
	groupOptions,
	viewOptions,
}: GroupViewOptionsProps) => {
	const handleGroupChange = (event: Parameters<NonNullableComponentTypeExtract<typeof Dropdown, 'onChange'>>[0]) => {
		setGroupOption(event.currentTarget.value as GroupOptionType)
	}

	const handleViewChange = (event: Parameters<NonNullableComponentTypeExtract<typeof Dropdown, 'onChange'>>[0]) => {
		setViewOption(event.currentTarget.value as ViewOptionType)
	}

	return (
		<Fragment>
			<Dropdown icon={<IconChevronDown24 />} onChange={handleGroupChange} options={groupOptions} value={groupOption} />
			<Dropdown icon={<IconChevronDown24 />} onChange={handleViewChange} options={viewOptions} value={viewOption} />
		</Fragment>
	)
}
