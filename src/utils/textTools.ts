import { StyleHashSegment, StyleSync } from '@/domain/Style/StylePage'

export const safeNumberConversion = (input: string) => {
	// 입력이 문자열이 아니면 그대로 반환
	if (typeof input !== 'string') {
		return input
	}

	// 문자열이 숫자로만 구성되어 있는지 확인 (양수, 음수, 소수점 허용)
	const numberRegex = /^-?\d+(\.\d+)?$/

	if (numberRegex.test(input)) {
		// 숫자로만 구성된 경우, Number 함수를 사용하여 변환
		return Number(input)
	} else {
		// 숫자가 아닌 문자가 포함된 경우, 원래 문자열 반환
		return input
	}
}

/** input이 숫자로 바꿨을 때 숫자면 true */
export const typeofNumber = (input: string) => {
	return typeof safeNumberConversion(input) === 'number'
}

// -_ 잡아서 스플릿해서 파스칼로
export const pascal = (text: string) =>
	text
		.split(/[-_]/) // 수정: - 또는 _로 스플릿
		.map((t, index) => {
			return t.charAt(0).toUpperCase() + t.slice(1)
			return t
		})
		.join('')

// -_ 잡아서 스플릿해서 카멜로 수정
export const camel = (text: string) =>
	text
		.split(/[-_]/) // 수정: - 또는 _로 스플릿
		.map((t, index) => {
			if (index > 0) return t.charAt(0).toUpperCase() + t.slice(1)
			return t
		})
		.join('')

/** svg-color-1 이 들어왔을 때, s */
export const varToName = (input: string) => {
	return input.split('-').slice(1).join('')
}

/** 랜덤 텍스트 */
export function generateRandomText(length: number) {
	const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
	let result = ''
	for (let i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * characters.length))
	}
	return result
}

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

export const encodeNumber = (num: number) => {
	let binary = Number(num).toString(2)
	while (binary.length % 6 !== 0) {
		binary = '0' + binary
	}
	let base64 = ''
	for (let i = 0; i < binary.length; i += 6) {
		let sixBits = binary.slice(i, i + 6)
		let index = parseInt(sixBits, 2)
		base64 += BASE64_CHARS[index]
	}
	return base64
}

export const generateRandomText2 = () => {
	const date = Date.now()
	return generateRandomText(3) + encodeNumber(date)
}

/**
 * 문자열 시작 부분의 # 또는 @ 문자를 모두 제거
 * @param text
 * @returns
 */
export const removeLeadingSymbols = (text: string) => {
	// 정규식을 사용하여 문자열 시작 부분의 # 또는 @ 문자를 모두 제거
	return text.replace(/^[#@❎✅]+/, '')
}

export const keyConventionRegex = (text: string) => {
	const trimmed = text.trim().replace(/[^a-zA-Z0-9_]/g, '')
	// 첫 글자가 숫자인 경우 '_'를 앞에 추가
	return /^\d/.test(trimmed) ? '_' + trimmed : trimmed
}

export const generateXmlString = (styles: StyleSync[], tag: 'id' | 'name') => {
	// 모든 스타일 정보를 위치별로 정렬
	const allRanges: Array<StyleHashSegment> = []

	styles.forEach((style) => {
		if (style.ranges) {
			style.ranges.forEach((range) => {
				// 시작 태그 정보
				allRanges.push({
					id: style.id ?? '',
					name: style.name ?? '',
					total: range.end + range.start,
					text: range.text,
					hashId: style.hashId,
					styles: style.style,
				})
			})
		}
	})

	// 위치에 따라 정렬 (시작 위치가 같으면 닫는 태그가 먼저 오도록)
	allRanges.sort((a, b) => {
		return a.total - b.total
	})

	return allRanges
		.map((item) => {
			return `<${item[tag]}>${item.text}</${item[tag]}>`
		})
		.join('')
}
