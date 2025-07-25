import { safeJsonParse } from '@/domain/utils/getStore'
import { LLog } from './console'

/**
 * JSON 텍스트를 파일로 만들어 브라우저에서 다운로드 saveAs 라이브러리로 대체함
 * @param {string} text - JSON 형식의 문자열
 * @param {string} filename - 다운로드할 파일 이름 (확장자 제외)
 */
export function downloadJsonFile(text: string): void {
	try {
		// JSON 문자열을 파싱하여 유효성 검사
		safeJsonParse(text)

		// Blob 객체 생성
		const blob = new Blob([text], { type: 'application/json' })

		// URL 생성
		const url = URL.createObjectURL(blob)

		// 임시 링크 요소 생성
		const link = document.createElement('a')
		link.href = url
		link.download = 'figma_svg_info.json'

		// 링크 클릭 이벤트 발생
		document.body.appendChild(link)
		link.click()

		// 임시 요소 및 URL 정리
		document.body.removeChild(link)
		URL.revokeObjectURL(url)
	} catch (error) {
		console.error('유효하지 않은 JSON 형식입니다:', error)
		alert('유효하지 않은 JSON 형식입니다. 다시 확인해주세요.')
	}
}

export const JsonToObject = async (files: File[]) => {
	// json 만
	const json = files.filter(file => file.type === 'application/json')
	const array = []
	for (const file of json) {
		const text = await file.text()
		array.push(text)
	}
	const result = array.flatMap(text => {
		const json = safeJsonParse(text)
		return json
	})
	return result
}
interface HTMLFileInputElement extends HTMLInputElement {
	files: FileList
}

export const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
	if (event.target instanceof HTMLInputElement && event.target.files) {
		const files = event.target.files
		const fileArray = Array.from(files)
		return JsonToObject(fileArray)
	} else {
		// 파일이 선택되지 않은 경우 처리
		LLog('svg', '파일이 선택되지 않았습니다.')
	}
}

/** 단일 객체를 추가하면서 필터 */
export const addValueFilterCurry =
	<T extends {}>(fn: (value: T, index: number, array: T[]) => boolean) =>
	(array: T[], data: T) => {
		return [...array, data].filter(fn)
	}

/** 어레이 객체를 추가하면서 필터 */
export const addArrayFilterCurry =
	<T extends {}>(fn: (value: T, index: number, array: T[]) => boolean) =>
	(array: T[], data: T[]) => {
		return [...array, ...data].filter(fn)
	}

// const addUniqueSection = <T extends { id: string; name: string }>(array: T[], data: T) => {
//   return [...array, data].filter(
//     (item, index, self) =>
//       index === self.findIndex((t) => t.id === item.id && t.name === item.name)
//   );
// };
