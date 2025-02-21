import { h } from 'preact'
import { addLayer, deleteLayer } from '../modal/Modal'

const MODAL_KEY = 'modal'
let timmer = setTimeout(() => {})

export const modalAlert = (text: string) => {
	addLayer(MODAL_KEY, <div>{text}</div>)
	clearTimeout(timmer)
	timmer = setTimeout(() => {
		deleteLayer(MODAL_KEY)
	}, 2000)
}
