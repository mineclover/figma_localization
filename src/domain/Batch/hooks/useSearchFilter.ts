import { useMemo } from 'preact/hooks'
import type { PatternMatchData } from '@/model/types'
import type { SearchOption } from './useSearchState'

export const useSearchFilter = (
	allPatternData: PatternMatchData[],
	searchValue: string,
	searchOption: SearchOption,
	allView: boolean,
	selectIds: string[]
) => {
	return useMemo(() => {
		return allPatternData.filter(item => {
			if (!allView) {
				if (item.ids.some(id => selectIds.includes(id))) {
					return true
				} else {
					return false
				}
			}
			if (searchValue === '') {
				return true
			}
			return item[searchOption].toLowerCase().includes(searchValue.toLowerCase())
		})
	}, [allPatternData, searchValue, searchOption, allView, selectIds])
}
