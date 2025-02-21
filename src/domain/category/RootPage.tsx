import { h } from 'preact'
import { useSignal } from '@/hooks/useSignal'
import { useEffect, useState } from 'preact/hooks'

import { DuplexDataHandler, prefix, signalEmit } from '../interface'
import { CurrentSectionInfo, Memo, Memos, SectionList } from '../types'
import { categoryAtom, currentCategoryAtom, hotTopic } from './categoryModel'
import { addLayer } from '@/components/modal/Modal'
import SectionPage, { SectionPath } from '../section/SectionPage'

import styles from './category.module.css'
import { clc } from '@/components/modal/utils'
import CategoryModal, { AddCategoryKey, RemoveCategoryKey } from './CategoryModal'
import SettingIcon from '@/icon/SettingIcon'
import Setting from '@/components/page/Setting'

import MemoPage from '../memo/MemoPage'
import { memosAtom } from '../memo/memoModel'
import { memoListAtom } from '../memo/memoModel'

import { currentSectionAtom, currentSectionFocusAtom } from '../section/sectionModel'
import { getSectionKey } from '../section/sectionRepo'

import './root.css'
import { IconLibrary32 } from '@create-figma-plugin/ui'

// 이름 추천 받아요

// 카테고리 페이지가 거의 루트 페이지라고 할 수 있음

function CategoryPage() {
	const memos = useSignal(memosAtom)
	const memoList = useSignal(memoListAtom)
	const category = useSignal(categoryAtom)
	const selectedCategory = useSignal(currentCategoryAtom)
	const currentSection = useSignal(currentSectionAtom)
	const focusMode = useSignal(currentSectionFocusAtom)

	const all = Object.values(memos)
	const pageId = currentSection.filter((section) => section.type === 'PAGE')[0]?.id ?? ''

	/** 카테고리에 값 추가 */
	const other = Object.keys(category).reduce(
		(acc, cur) => {
			acc[cur] = all.filter((memo) => {
				if (!(memo.category === cur)) return false
				const rootSection = getSectionKey(currentSection, focusMode)
				console.log('rootSection,L49:', rootSection, focusMode, currentSection)
				try {
					const sectionBackLink = memo.sectionBackLink[0] ?? ''
					if (sectionBackLink.startsWith(rootSection)) return true
				} catch (e) {
					console.error('RootPage:53L', e)
				}
				return false
			}) as Memo[]
			return acc
		},
		{} as Record<string, Memo[]>
	)

	/** 조회된 전체 메모 리스트
	 * fix 리스트는 현재 pin 리스트인데 따로 관리하기 때문에 아직 개발 안됨
	 */
	const allMemo = { ...other, all }

	const setSelectedCategory = (category: string) => {
		currentCategoryAtom.value = category
	}

	const menus = {
		// fix: hotTopic.fix,
		...category,
		...hotTopic,
		// setting: hotTopic.setting,
	}
	// 섹션 정보 얻고
	// 얻은 카테고리에 따라 메모 필터링해서 각 카테고리에 전달

	const handleCategoryClick = (category: string) => {
		setSelectedCategory(category)
	}

	useEffect(() => {
		// 카테고리 탭 바꿀 때 pub 조회

		signalEmit('SIGNAL_pub')
	}, [selectedCategory])
	console.log('memos', memos, allMemo)

	return (
		<div>
			<header className={styles.header}>
				{/* 히스토리 */}
				{/* <button className={styles.icon}>
					<IconArrowLeft16 />
				</button>
				<button className={styles.icon}>
					<IconArrowRight16 />
				</button> */}
				<SectionPath currentSection={currentSection} pageId={pageId} />
				{/* <div className={styles.mainTitle}>project name</div> */}
				{/* 검색 */}
				{/* 필터링 */}
				{/* <button className={styles.icon}>
					<IconSearch32 />
				</button>
				<div className={styles.icon}>
					<FilterIcon />
				</div> */}
			</header>
			<aside className={styles.tabs}>
				{Object.entries(menus).map(([key, value]) => {
					const target = allMemo[key as keyof typeof allMemo] ?? []

					const active = selectedCategory === key
					if (key === 'fix')
						return (
							<button
								className={clc(styles.fix, active && styles.active)}
								key={key}
								onClick={() => handleCategoryClick(key)}
							>
								{key}
								<div className={clc(styles.badge, styles.pinned)}>{target.length}</div>
							</button>
						)

					if (key === 'all')
						return (
							<button
								className={clc(styles.all, active && styles.active)}
								key={key}
								onClick={() => handleCategoryClick(key)}
							>
								<IconLibrary32 />
								<div className={clc(styles.badge, styles.pinned)}>{target.length}</div>
							</button>
						)
					// if (key === 'setting')
					// 	return (
					// 		<button
					// 			className={clc(styles.setting, active && styles.active)}
					// 			key={key}
					// 			onClick={() => handleCategoryClick(key)}
					// 		>
					// 			<SettingIcon />
					// 		</button>
					// 	)

					if (key === 'setting')
						return (
							<button
								className={styles.menu}
								key={key}
								onClick={() => {
									handleCategoryClick(key)
									// addLayer(AddKey, <CategoryModal.AddModal />)
								}}
							>
								<SettingIcon />
							</button>
						)

					return (
						<button
							className={clc(styles.tab, active && styles.active)}
							key={key}
							onClick={() => {
								handleCategoryClick(key)
							}}
							onContextMenu={(e) => {
								console.log('Category onContextMenu', e)
								addLayer(RemoveCategoryKey, <CategoryModal.RemoveModal target={key} />)
							}}
						>
							<div className={clc(styles.badge, styles.normal)}>{target.length}</div>
							{key}
						</button>
					)
					// 설명 추가할 자리가 애매하다
				})}
			</aside>

			<main>
				{selectedCategory === 'setting' ? (
					<Setting />
				) : (
					<MemoPage
						memos={allMemo[selectedCategory as keyof typeof allMemo]}
						categoryName={selectedCategory}
						categoryValue={menus[selectedCategory as keyof typeof menus]}
					/>
				)}
			</main>
			<button
				onClick={() => {
					addLayer('hello', <div>test</div>)
				}}
			></button>
		</div>
	)
}

export default CategoryPage
