// Hex to Base64 conversion
export function hexToBase64(hexString: string) {
	// Check if the input is a valid hex string
	if (!/^[0-9A-Fa-f]+$/.test(hexString)) {
		throw new Error('Invalid hexadecimal input')
	}

	// Make sure the hex string has an even number of characters
	if (hexString.length % 2 !== 0) {
		hexString = `0${hexString}`
	}

	// Convert hex to binary string
	const binaryString = (hexString.match(/.{1,2}/g) ?? []).map(byte => String.fromCharCode(parseInt(byte, 16))).join('')

	// Use btoa to convert binary string to Base64
	return figmaBtoa(binaryString)
}

// Base64 to Hex conversion
export function base64ToHex(base64String: string) {
	try {
		// Use atob to convert Base64 to binary string
		const binaryString = atob(base64String)

		// Convert binary string to hex
		return Array.from(binaryString)
			.map(char => char.charCodeAt(0).toString(16).padStart(2, '0'))
			.join('')
			.toUpperCase()
	} catch (_error) {
		throw new Error('Invalid Base64 input')
	}
}

export const base64TokenEncode = (base: string) =>
	`KEY${base.replace(/=/g, '').replace(/\//g, '_').replace(/\//g, '_').replace(/\+/g, '-')}`

export const base64TokenDecode = (base: string) => base.replace('KEY', '').replace(/_/g, '/').replace(/-/g, '+')

function stringToUint8Array(str: string) {
	const arr = new Uint8Array(str.length)
	for (let i = 0; i < str.length; i++) {
		arr[i] = str.charCodeAt(i)
	}
	return arr
}

function uint8ArrayToString(uint8Array: number[]) {
	return String.fromCharCode.apply(null, uint8Array)
}

function figmaBtoa(base: string) {
	return figma.base64Encode(stringToUint8Array(base))
}

function _figmaAtob(base: string) {
	return uint8ArrayToString([...figma.base64Decode(base)])
}

/**
 * 두 객체의 내용이 동일한지 깊게 비교하는 함수
 * @param {any} obj1 - 첫 번째 비교할 객체
 * @param {any} obj2 - 두 번째 비교할 객체
 * @returns {boolean} - 두 객체가 동일하면 true, 아니면 false
 */
export function deepEqual(obj1: any, obj2: any) {
	// 기본 타입이거나 null인 경우 직접 비교
	if (obj1 === obj2) {
		return true
	}

	// 둘 중 하나만 null이거나 undefined인 경우
	if (obj1 == null || obj2 == null) {
		return false
	}

	// 타입이 다른 경우
	if (typeof obj1 !== typeof obj2) {
		return false
	}

	// 배열인 경우
	if (Array.isArray(obj1) && Array.isArray(obj2)) {
		if (obj1.length !== obj2.length) {
			return false
		}

		for (let i = 0; i < obj1.length; i++) {
			if (!deepEqual(obj1[i], obj2[i])) {
				return false
			}
		}

		return true
	}

	// 일반 객체인 경우
	if (typeof obj1 === 'object' && typeof obj2 === 'object') {
		const keys1 = Object.keys(obj1)
		const keys2 = Object.keys(obj2)

		if (keys1.length !== keys2.length) {
			return false
		}

		for (const key of keys1) {
			if (!keys2.includes(key)) {
				return false
			}
			if (!deepEqual(obj1[key], obj2[key])) {
				return false
			}
		}

		return true
	}

	// 그 외의 경우 (함수, 날짜 등)
	return String(obj1) === String(obj2)
}
