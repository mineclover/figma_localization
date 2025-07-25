import { h } from 'preact'
import { addLayer, deleteLayer } from '../modal/Modal'
import styles from './alert.module.css'

const MODAL_KEY = 'modal'
let timmer = setTimeout(() => {
	// 초기화용 빈 타이머
})

export const modalAlert = (text: React.ReactNode) => {
	addLayer(MODAL_KEY, <div className={styles.box}>{text}</div>)
	clearTimeout(timmer)
	timmer = setTimeout(() => {
		deleteLayer(MODAL_KEY)
	}, 2000)
}
