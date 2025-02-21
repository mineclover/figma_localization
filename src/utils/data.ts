// Hex to Base64 conversion
export function hexToBase64(hexString: string) {
	// Check if the input is a valid hex string
	if (!/^[0-9A-Fa-f]+$/.test(hexString)) {
		throw new Error('Invalid hexadecimal input')
	}

	// Make sure the hex string has an even number of characters
	if (hexString.length % 2 !== 0) {
		hexString = '0' + hexString
	}

	// Convert hex to binary string
	const binaryString = (hexString.match(/.{1,2}/g) ?? [])
		.map((byte) => String.fromCharCode(parseInt(byte, 16)))
		.join('')

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
			.map((char) => char.charCodeAt(0).toString(16).padStart(2, '0'))
			.join('')
			.toUpperCase()
	} catch (error) {
		throw new Error('Invalid Base64 input')
	}
}

export const base64TokenEncode = (base: string) =>
	'KEY' + base.replace(/=/g, '').replace(/\//g, '_').replace(/\//g, '_').replace(/\+/g, '-')

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

function figmaAtob(base: string) {
	return uint8ArrayToString([...figma.base64Decode(base)])
}
