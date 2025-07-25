import * as crypto from 'crypto-js'
/**
 * 객체의 속성을 안정적으로 정렬하여 일관된 해시 키를 생성하는 함수
 * jsonStringify 와 다름 " " 를 넣지 않기 때문
 * @param {Object} styleObj - 키로 변환할 스타일 객체
 * @returns {string} 안정적인 해시 키
 */
export function createStableStyleKey(styleObj: Record<string, any>): string {
	// 기본 타입 처리
	if (styleObj === null || typeof styleObj !== 'object') {
		return String(styleObj)
	}

	// 배열 처리
	if (Array.isArray(styleObj)) {
		return `[${styleObj.map(createStableStyleKey).join(',')}]`
	}

	// 객체 처리: 키를 알파벳 순으로 정렬하고 값 직렬화
	const sortedKeys = Object.keys(styleObj).sort()
	return (
		'{' +
		sortedKeys
			.map(key => {
				const value = styleObj[key]
				return `${key}:${createStableStyleKey(value)}`
			})
			.join(',') +
		'}'
	)
}

/**
 * 문자열을 SHA256 해시로 변환하는 함수
 * @param {string} str - 해시할 문자열
 * @returns {string} SHA256 해시 문자열
 */
export function sha256Hash(str: string): string {
	// crypto-js 라이브러리를 사용하려면 먼저 설치해야 합니다:
	// npm install crypto-js
	// 또한 타입 정의를 위해: npm install @types/crypto-js

	return crypto.SHA256(str).toString()
}
