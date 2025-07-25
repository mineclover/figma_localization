import { signal } from '@preact/signals-core'
import { h } from 'preact'
import { useEffect, useRef, useState } from 'preact/hooks'
import { useSignal } from '@/hooks/useSignal'
import ClientModal, { type ClientModalProps } from './ClientModal'

type CloseProps = { close: boolean; [key: string]: any }

type JSXModal = (props: CloseProps) => h.JSX.Element

type FunctionAtomProps = {
	addLayer: (key: string, jsx: h.JSX.Element, props?: Omit<ClientModalProps, 'modalKey'>) => void
	deleteLayer: Function
}

// 실제 데이터와 데이터 핸들링하는 sort 분리
// 데이터 삭제 객체 분리
// 데이터 삭제 객체 내에서 이벤트 핸들러 객체 싱글톤으로 구성
// 이벤트 전파 최소화 목적의 모듈화

export const closeMs = 150

const layerAtom = signal<Record<string, JSXModal>>({})
const sortAtom = signal<string[]>([])
const deleteAtom = signal<Record<string, NodeJS.Timeout>>({})
const setSort = (fn: (state: string[]) => string[]) => (sortAtom.value = fn(sortAtom.value))

const setLayer = (fn: (state: Record<string, JSXModal>) => Record<string, JSXModal>) =>
	(layerAtom.value = fn(layerAtom.value))

export const modalFunctionAtom = signal<FunctionAtomProps>({
	deleteLayer: (key: string) => {
		const target = deleteAtom.value[key]
		if (target) {
			clearTimeout(target)
		}
		// setSort((state) => state.filter((element) => element !== key))
		const timmer = setTimeout(() => {
			delete deleteAtom.value[key]
			setSort(state => state.filter(element => element !== key))
		}, closeMs)

		deleteAtom.value = {
			...deleteAtom.value,
			[key]: timmer,
		}
	},
	addLayer: (key: string, jsx: h.JSX.Element, options?: Omit<ClientModalProps, 'modalKey'>) => {
		const target = deleteAtom.value[key]
		if (target) {
			clearTimeout(target)
		}

		const Temp = (props: CloseProps) => (
			<ClientModal key={key} {...options} close={props.close} modalKey={key}>
				{jsx}
			</ClientModal>
		)

		setLayer(state => ({ ...state, [key]: Temp }))

		setSort(state =>
			[...state.filter(i => i !== key), key].filter((value, index, self) => self.indexOf(value) === index)
		)
	},
})

export const { addLayer, deleteLayer } = modalFunctionAtom.value

const ClientModalProvider = () => {
	const layer = useSignal(layerAtom)
	const sort = useSignal(sortAtom)
	const deleteList = useSignal(deleteAtom)

	// const setFunction = useSetAtom(modalFunctionAtom)

	useEffect(() => {
		// sort 새로 고침 등에서 사라지는 로직
		// 보이는 걸 먼저 없애고 삭제하는 구조
		// 이벤트가 발생하면 삭제 대상에게 close를 전달하고
		const layerKey = Object.keys(layer)
		const temp = layer

		layerKey.forEach(name => {
			if (sort.includes(name)) {
				return
			}

			delete temp[name]
		})

		setLayer(state => ({ ...state, ...temp }))
	}, [sort, layer])

	// const target = document.getElementById('crew-root') ? document.getElementById('crew-root') : document.body!
	// 삭제 구현 ...

	return (
		<div>
			{sort.map(name => {
				const Tag = layer[name]
				const keys = Object.keys(deleteList)
				const close = keys.includes(name)

				/** 이렇게 데이터를 주는 이유는 리렌더링 최소화 */
				return <Tag key={name} close={close}></Tag>
			})}
		</div>
	)
}

export default ClientModalProvider
