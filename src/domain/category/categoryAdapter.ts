import { createDataHandlers, dataEmit, signalReceiving } from '../interface'
import { getMainCategory, setMainCategory } from './categoryRepo'

export const {
	dataOn: dataCategoryOn,
	dataOnce: dataCategoryOnce,
	dataEmit: dataCategoryEmit,
	signalOn: signalCategoryOn,
	signalOnce: signalCategoryOnce,
	signalEmit: signalCategoryEmit,
} = createDataHandlers<'category'>()

export const mainCategory_Adapter = () => {
	// 솔직히 이 쪽 로직은 좀 안정성이 떨어지긴 한데
	// 카테고리 수정할 일 자체가 거의 없고
	// 메모 데이터가 사라지진 않아서 일단 생략함
	// 삭제 프로토콜을 정의하기 어려움
	dataCategoryOn('DATA_category', (category) => {
		setMainCategory(category)
		dataEmit('DATA_category', category)
	})
	signalCategoryOn('SIGNAL_category', (key) => {
		const category = getMainCategory()
		signalReceiving('category', key)(category)
	})
}
