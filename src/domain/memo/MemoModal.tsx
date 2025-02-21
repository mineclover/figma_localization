import { ComponentChildren, Fragment, h } from 'preact'
import { Dispatch, StateUpdater, useEffect, useState } from 'preact/hooks'

import styles from './memo.module.css'

import { Memo, MemoCategoryList } from '../types'

import { useSignal } from '@/hooks/useSignal'
import { clc } from '@/components/modal/utils'
import { addLayer, deleteLayer } from '@/components/modal/Modal'
import { memoAtom } from './memoModel'
import { dataMemoEmit, dataMemosEmit } from './memoAdapter'
import { NodePath, SectionPath } from '../section/SectionPage'
import { currentSectionAtom } from '../section/sectionModel'
import { categoryAtom, currentCategoryAtom } from '../category/categoryModel'
import { AddMemoType } from '../utils/featureType'
import { selectedType } from '../interface'
import {
	componentKeyParser,
	generateMemoKey,
	getCurrentSectionToComponentKey,
	getCurrentSectionToComponentName,
} from '../interfaceBuilder'
import { componentKeyBuilder } from '../interfaceBuilder'
import { getSectionKey } from '../section/sectionRepo'
import { userAtom } from '../user/userModel'
import { NodeZoomHandler } from '@/figmaPluginUtils/types'
import { emit } from '@create-figma-plugin/utilities'
import { Dropdown, IconCross32, IconPlus32, IconTarget16, IconTarget32, IconTrash32 } from '@create-figma-plugin/ui'
import { MemoBlockProps } from '@/components/page/MemoBlock'

const ComponentKeyButton = ({
	component,
	useSelectedComponent,
}: {
	component: [string, string]
	/** 컴포넌트 선택 상태 관리 때문에 */
	useSelectedComponent: [Map<string, string>, Dispatch<StateUpdater<Map<string, string>>>]
}) => {
	const [selectedComponent, setSelectedComponent] = useSelectedComponent
	const [componentKey, componentName] = component
	const parsed = componentKeyParser(componentKey)
	if (!parsed) return null
	const { pageId, nodeId } = parsed
	return (
		<div className={styles.row}>
			<button onClick={() => emit<NodeZoomHandler>('NODE_ZOOM', { pageId, nodeId })}>
				<IconTarget32 />
			</button>
			<span className={styles.flexGrow}>{componentName}</span>
			<button
				className={styles.flexShrink}
				onClick={() =>
					setSelectedComponent((prev) => {
						prev.delete(componentKey)
						return new Map(prev)
					})
				}
			>
				<IconTrash32 />
			</button>
		</div>
	)
}

function AddMemoModal() {
	const selectedCategory = useSignal(currentCategoryAtom)
	const currentUser = useSignal(userAtom)

	const [memoKey, setMemoKey] = useState<string>(generateMemoKey())
	const currentSection = useSignal(currentSectionAtom)
	const pageId = currentSection.filter((section) => section.type === 'PAGE')[0]?.id ?? ''
	const nodeId = currentSection.filter((section) => section.type === selectedType)[0]?.id ?? ''

	const [inputUrl, setUrl] = useState<string>('')
	const [inputDescription, setDescription] = useState<string>('')
	const [inputTitle, setTitle] = useState<string>('')

	// 이름을 따로 저장하진 않는 상태
	// 개별 컴포넌트에 대한 데이터를 처리하는 건 다음 MVP
	const useSelectedComponent = useState<Map<string, string>>(new Map([]))
	const [selectedComponent, setSelectedComponent] = useSelectedComponent

	const currentSEctionSave = () => {
		setSelectedComponent((prev) => {
			const componentKey = getCurrentSectionToComponentKey(currentSection, 'node')
			const componentName = getCurrentSectionToComponentName(currentSection, 'node')
			if (componentKey && componentName) {
				prev.set(componentKey, componentName)
				return new Map(prev)
			}
			// 변경 없음을 의미
			return prev
		})
	}
	useEffect(() => {
		// 추가할 때 선택한 노드는 자동 추가
		currentSEctionSave()
	}, [])

	return (
		<div className={styles.addModal}>
			<button className={styles.close}>
				<h2 className={styles.title}>메모 추가</h2>

				<IconCross32 className={styles.icon} onClick={() => deleteLayer(AddMemoKey)} />
			</button>
			<form
				className={clc(styles.modal, styles.add)}
				onSubmit={(e) => {
					e.preventDefault()
					console.log(
						'currentSection',
						currentSection.filter((section) => section.type === selectedType)
					)

					/** 추가할 때 선택된 상태인 컴포넌트는 첫번째로 등록함 */
					const componentKey = getCurrentSectionToComponentKey(currentSection, 'node')

					const newMemo = {
						key: memoKey,
						url: inputUrl,
						title: inputTitle,
						description: inputDescription,
						category: selectedCategory,
						writer: currentUser.uuid,
						sectionBackLink: [getSectionKey(currentSection, 'section')],
						componentLink: [componentKey, ...selectedComponent.keys()].filter(
							(i, index, self) => self.indexOf(i) === index
						),
					} as AddMemoType

					console.log('newMemo', { [memoKey]: newMemo })
					dataMemosEmit('DATA_memos', { [memoKey]: newMemo })
					deleteLayer(AddMemoKey)
				}}
			>
				<span className={styles.header}>
					Tab Name: <b>{selectedCategory}</b>
				</span>

				<SectionPath className={styles.section} currentSection={currentSection} pageId={pageId} />
				<hr className={styles.divider} />
				<input
					type="text"
					className={styles.title}
					value={inputTitle}
					placeholder="메모 제목"
					onInput={(e) => setTitle(e.currentTarget.value)}
				/>
				<input
					type="text"
					value={inputUrl}
					className={styles.main}
					placeholder="메모 링크"
					onInput={(e) => setUrl(e.currentTarget.value)}
				/>

				<textarea
					type="text"
					className={styles.description}
					value={inputDescription}
					placeholder="메모 설명"
					onInput={(e) => setDescription(e.currentTarget.value)}
				/>
				<button className={styles.submit}>추가</button>
			</form>
			<NodePath currentSection={currentSection} pageId={pageId} />
			<section className={styles.component}>
				<button
					className={clc(styles.componentAdd, styles.row)}
					onClick={() => {
						currentSEctionSave()
					}}
				>
					<IconPlus32 />
					<span> 참조 노드 추가</span>
				</button>
				{selectedComponent.size > 0 && (
					<div className={styles.column}>
						{selectedComponent &&
							Array.from(selectedComponent).map((component) => {
								return <ComponentKeyButton component={component} useSelectedComponent={useSelectedComponent} />
							})}
					</div>
				)}
			</section>
		</div>
	)
}

function EditMemoModal({ memoKey, url, title, description, componentLink, category }: MemoBlockProps) {
	const currentUser = useSignal(userAtom)

	const currentSection = useSignal(currentSectionAtom)
	const categoryList = useSignal(categoryAtom)
	const pageId = currentSection.filter((section) => section.type === 'PAGE')[0]?.id ?? ''
	const nodeId = currentSection.filter((section) => section.type === selectedType)[0]?.id ?? ''

	const [inputUrl, setUrl] = useState<string>(url)
	const [inputDescription, setDescription] = useState<string>(description)
	const [inputTitle, setTitle] = useState<string>(title)
	const [selectedCategory, setCategory] = useState<string>(category)

	// 이름을 따로 저장하진 않는 상태
	// 개별 컴포넌트에 대한 데이터를 처리하는 건 다음 MVP

	const beforeComponentLink = componentLink.map((component, index) => [component, 'before value']) as [string, string][]

	const useSelectedComponent = useState<Map<string, string>>(new Map(beforeComponentLink))
	const [selectedComponent, setSelectedComponent] = useSelectedComponent

	const currentSEctionSave = () => {
		setSelectedComponent((prev) => {
			const componentKey = getCurrentSectionToComponentKey(currentSection, 'node')
			const componentName = getCurrentSectionToComponentName(currentSection, 'node')
			if (componentKey && componentName) {
				prev.set(componentKey, componentName)
				return new Map(prev)
			}
			// 변경 없음을 의미
			return prev
		})
	}

	return (
		<div className={styles.addModal}>
			<button className={styles.close}>
				<h2 className={styles.title}>메모 수정</h2>

				<IconCross32 className={styles.icon} onClick={() => deleteLayer(EditMemoKey)} />
			</button>
			<form
				className={clc(styles.modal, styles.add)}
				onSubmit={(e) => {
					e.preventDefault()
					console.log(
						'currentSection',
						currentSection.filter((section) => section.type === selectedType)
					)

					/** 추가할 때 선택된 상태인 컴포넌트는 첫번째로 등록함 */
					const componentKey = getCurrentSectionToComponentKey(currentSection, 'node')

					const newMemo = {
						key: memoKey,
						url: inputUrl,
						title: inputTitle,
						description: inputDescription,
						category: selectedCategory,
						writer: currentUser.uuid,
						sectionBackLink: [getSectionKey(currentSection, 'section')],
						componentLink: [componentKey, ...selectedComponent.keys()].filter(
							(i, index, self) => self.indexOf(i) === index
						),
					} as AddMemoType

					console.log('newMemo', { [memoKey]: newMemo })
					dataMemosEmit('DATA_memos', { [memoKey]: newMemo })
					deleteLayer(EditMemoKey)
				}}
			>
				<span className={styles.header}>
					Tab Name:
					<select
						className={styles.category}
						value={selectedCategory}
						onChange={function (event) {
							setCategory(event.currentTarget.value)
						}}
					>
						{Object.keys(categoryList).map((category) => (
							<option value={category}>{category}</option>
						))}
					</select>
				</span>

				<SectionPath className={styles.section} currentSection={currentSection} pageId={pageId} />
				<hr className={styles.divider} />
				<input
					type="text"
					className={styles.title}
					value={inputTitle}
					placeholder="메모 제목"
					onInput={(e) => setTitle(e.currentTarget.value)}
				/>
				<input
					type="text"
					value={inputUrl}
					className={styles.main}
					placeholder="메모 링크"
					onInput={(e) => setUrl(e.currentTarget.value)}
				/>

				<textarea
					type="text"
					className={styles.description}
					value={inputDescription}
					placeholder="메모 설명"
					onInput={(e) => setDescription(e.currentTarget.value)}
				/>
				<button className={styles.submit}>수정</button>
			</form>
			<NodePath currentSection={currentSection} pageId={pageId} />
			<section className={styles.component}>
				<button
					className={clc(styles.componentAdd, styles.row)}
					onClick={() => {
						currentSEctionSave()
					}}
				>
					<IconPlus32 />
					<span> 참조 노드 추가</span>
				</button>
				{selectedComponent.size > 0 && (
					<div className={styles.column}>
						{selectedComponent &&
							Array.from(selectedComponent).map((component) => {
								return <ComponentKeyButton component={component} useSelectedComponent={useSelectedComponent} />
							})}
					</div>
				)}
			</section>
		</div>
	)
}

export const AddMemoKey = 'AddMemoKey'
export const RemoveMemoKey = 'RemoveMemoKey'
export const EditMemoKey = 'EditMemoKey'

export const OptionModal = (props: MemoBlockProps) => {
	const { memoKey: key, writer, title, description } = props
	const user = useSignal(userAtom)

	if (writer !== user.uuid) return <span>작성자만 수정 가능</span>

	return (
		<div className={styles.more}>
			<span>수정 가능</span>
			{/* <span> {description}</span> */}
			{/* <button>이동</button> */}
			{/* <button onClick={() => deleteLayer(AddMemoKey)}>상세정보</button> */}
			<button className={styles.button} onClick={() => addLayer(EditMemoKey, <EditMemoModal {...props} />)}>
				수정
			</button>
			<button
				className={clc(styles.button, styles.delete)}
				onClick={() => addLayer(RemoveMemoKey, <RemoveMemoModal {...props} />)}
			>
				삭제
			</button>
		</div>
	)
}

const RemoveMemoModal = ({ memoKey: key, title, ...props }: MemoBlockProps) => {
	return (
		<div className={clc(styles.modal, styles.remove)}>
			<span className={styles.header}>메모 삭제</span>
			<div className={styles.main}>
				<span className={styles.sub}>메모 내용: </span>
				<span className={styles.text}>{title}</span>
			</div>
			<button
				className={styles.delete}
				onClick={() => {
					// @ts-ignore
					dataMemosEmit('DATA_memos', {
						[key]: {
							key: '',
						},
					})
					deleteLayer(RemoveMemoKey)
				}}
			>
				삭제 확인
			</button>
		</div>
	)
}

export default { AddModal: AddMemoModal, RemoveModal: RemoveMemoModal, EditModal: EditMemoModal }
