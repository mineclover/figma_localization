import { Fragment, h } from 'preact'
import { useSignal } from '@/hooks/useSignal'
import { useState } from 'preact/hooks'
import { currentSectionAtom, currentSectionFocusAtom, sectionListAtom } from './sectionModel'
import { dataEmitCurrentSection, dataEmitList } from './sectionAdapter'
import { CurrentSectionInfo, SectionList } from '../types'
import { modalAlert } from '@/components/alert'
import styles from './section.module.css'
import { addLayer } from '@/components/modal/Modal'
import { clc } from '@/components/modal/utils'
import { getRootSection, getSectionKey } from './sectionRepo'

// 섹션 추가 삭제는 메모 추가 삭제에 의해 자연스럽게 발생하는 동작임
type Props = {
	pageId: string
}

const SectionItem = ({ pageId, id, name, type, alias }: CurrentSectionInfo & Props) => {
	const [aliasInput, setAliasInput] = useState<string>(alias)

	const handleAliasUpdate = () => {
		console.log(pageId, id, alias)
		// type, name 말고 안보내도 되는데..
		dataEmitCurrentSection('DATA_currentSection', [{ id, name, type, alias: aliasInput }])
		addLayer('test', <div>성공</div>)
	}

	const handlePageMove = () => {
		console.log('이동', pageId, id, alias)
		addLayer('test', <div>성공</div>)
	}

	return (
		<div className={styles.sectionItem}>
			<span className={styles.typeArea}>{type}</span>
			{/* <button className={styles.idArea} onClick={() => handlePageMove()}>
				화면 이동
			</button> */}
			<span className={styles.nameArea}>{name}</span>
			<div className={styles.aliasArea}>
				<input
					type="text"
					placeholder={alias === '' ? '설정된 별칭이 없음' : alias}
					value={aliasInput}
					onChange={(e) => setAliasInput(e.currentTarget.value)}
				/>
			</div>
			<div className={styles.buttonArea}>
				<button onClick={() => handleAliasUpdate()}>수정</button>
			</div>
		</div>
	)
}

// pageId 는 상위 요소를 줌 하기 위해 제공했음

/**
 * 전체 경로 뷰어로 사용 중인 상태
 * alias 를 설정해야하는 경우가 아니라면 일관된 최종 경로로 보여줘야함
 */
export const SectionPath = ({
	pageId,
	currentSection,
	className,
}: { pageId: string; currentSection: CurrentSectionInfo[]; className?: string } & Props) => {
	const focusMode = useSignal(currentSectionFocusAtom)
	const rootSection = focusMode === 'section' ? getRootSection(currentSection) : currentSection

	// 포커스 모드에 따라 실제 데이터를 보여주는 것이 달라지게 하는 걸로

	return (
		<div className={clc(styles.currentWrapper, className)}>
			<button
				type="button"
				onClick={() => {
					if (focusMode === 'section') {
						currentSectionFocusAtom.value = 'page'
					} else if (focusMode === 'page') {
						currentSectionFocusAtom.value = 'section'
					}
				}}
				className={styles.title}
			>
				{focusMode === 'section' && '현재 섹션:'}
				{focusMode === 'page' && '현재 페이지:'}
			</button>
			{rootSection.map((section, index) => {
				const context = section.alias === '' ? section.name : section.alias
				const isLast = index === rootSection.length - 1
				const isFirst = index === 0

				if (section.type === 'SELECTED') {
					return null
				}
				// 모드 호환 목적
				if (focusMode === 'page' && section.type !== 'PAGE') {
					return null
				}

				return (
					<Fragment key={section.id}>
						{!isFirst && <span>/</span>}
						<span className={styles.content}>{context}</span>
					</Fragment>
				)
			})}
		</div>
	)
}

export const NodePath = ({
	pageId,
	currentSection,
	className,
}: { pageId: string; currentSection: CurrentSectionInfo[]; className?: string } & Props) => {
	return (
		<div className={clc(styles.currentWrapper, className)}>
			{currentSection.map((section, index) => {
				const context = section.alias === '' ? section.name : section.alias
				const isLast = index === currentSection.length - 1

				if (isLast) {
					return (
						<span key={section.id} className={styles.selected}>
							{context}
						</span>
					)
				}
				return (
					<Fragment key={section.id}>
						<span className={styles.content}>{context}</span>
						{!isLast && <span>/</span>}
					</Fragment>
				)
			})}
		</div>
	)
}

const SectionPage = () => {
	const sectionList = useSignal(sectionListAtom)
	const currentSection = useSignal(currentSectionAtom)
	const pageId = currentSection.filter((section) => section.type === 'PAGE')[0]?.id ?? ''

	const [newSection, setNewSection] = useState<string>('')

	const handleSectionUpdate = (newName: string) => {
		// 중복 체크 추가
		if (newName === '') {
			modalAlert('이름이 입력되지 않음')
			return
		}
		if (sectionList.includes(newName)) {
			modalAlert('이미 존재하는 섹션 명')
			return
		}
		console.log(newName, 'newName', newName, '<')

		dataEmitList('DATA_sectionList', [...sectionList, newName])
		setNewSection('')
	}

	const handleCurrentSectionUpdate = (input: SectionList) => {
		dataEmitList('DATA_sectionList', input)
	}

	return (
		<div className={styles.wrapper}>
			<SectionPath pageId={pageId} currentSection={currentSection} />
			{/* <div>{currentSection.map((section) => section.id).join('/')}</div> */}
			<hr className={styles.divider} />
			{currentSection.map((section) => (
				<SectionItem pageId={pageId} {...section} />
			))}
		</div>
	)
}

export default SectionPage
