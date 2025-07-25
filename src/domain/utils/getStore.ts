export function safeJsonParse<T>(json: string): T | undefined {
	try {
		const data = JSON.parse(json) as T
		return data
	} catch (_error) {
		return
	}
}

export function getFigmaRootStore<T>(key: string): T | undefined {
	const value = figma.root.getPluginData(key)
	return safeJsonParse<T>(value)
}

export function getFigmaCurrentPageStore<T>(key: string): T | undefined {
	const value = figma.currentPage.getPluginData(key)
	return safeJsonParse<T>(value)
}

export function setFigmaRootStore<T>(key: string, value: T) {
	figma.root.setPluginData(key, JSON.stringify(value))
}

export function setFigmaCurrentPageStore<T>(key: string, value: T) {
	figma.currentPage.setPluginData(key, JSON.stringify(value))
}
