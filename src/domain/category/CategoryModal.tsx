import { ComponentChildren, Fragment, h } from 'preact'
import { useEffect, useState } from 'preact/hooks'

import styles from './category.module.css'
import { dataCategoryEmit } from './categoryAdapter'
import { MemoCategoryList } from '../types'
import { categoryAtom } from './categoryModel'
import { useSignal } from '@/hooks/useSignal'
import { clc } from '@/components/modal/utils'
import { deleteLayer } from '@/components/modal/Modal'
import { signalEmit } from '../interface'

function AddCategoryModal() {
	const category = useSignal<MemoCategoryList>(categoryAtom)

	const [inputCategory, setCategory] = useState<string>('')
	const [description, setDescription] = useState<string>('')

	return (
		<form
			className={clc(styles.modal, styles.add)}
			onSubmit={(e) => {
				e.preventDefault()
				console.log('DATA_category', e, inputCategory, description)
				dataCategoryEmit('DATA_category', {
					...category,
					[inputCategory]: description,
				})
			}}
		>
			<span className={styles.header}>카테고리 추가</span>

			<input
				type="text"
				value={inputCategory}
				className={styles.main}
				placeholder="추가할 카테고리 제목"
				onInput={(e) => setCategory(e.currentTarget.value)}
			/>
			<input
				type="text"
				className={styles.description}
				value={description}
				placeholder="카테고리 설명"
				onInput={(e) => setDescription(e.currentTarget.value)}
			/>
			<button className={styles.submit}>추가</button>
		</form>
	)
}

export const AddCategoryKey = 'AddCategoryKey'
export const RemoveCategoryKey = 'RemoveCategoryKey'

function RemoveCategoryModal({ target }: { target: string }) {
	const category = useSignal<MemoCategoryList>(categoryAtom)

	return (
		<form
			className={clc(styles.modal, styles.remove)}
			onSubmit={(e) => {
				e.preventDefault()

				const newCategory = { ...category }
				delete newCategory[target]
				dataCategoryEmit('DATA_category', newCategory)
				deleteLayer(RemoveCategoryKey)
			}}
		>
			<span className={styles.header}>카테고리 삭제</span>
			<div className={styles.main}>
				<span className={styles.sub}>카테고리 명: </span>
				<span className={styles.text}>{target}</span>
			</div>
			<button className={styles.delete}>삭제 확인</button>
		</form>
	)
}

export default { AddModal: AddCategoryModal, RemoveModal: RemoveCategoryModal }
