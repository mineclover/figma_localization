import { h } from 'preact';
import { addLayer, deleteLayer } from '../modal/Modal';
import styles from './alert.module.css';
const MODAL_KEY = 'modal';
let timmer = setTimeout(() => {});

export const modalAlert = (text: string) => {
	addLayer(MODAL_KEY, <div className={styles.box}>{text}</div>);
	clearTimeout(timmer);
	timmer = setTimeout(() => {
		deleteLayer(MODAL_KEY);
	}, 2000);
};
