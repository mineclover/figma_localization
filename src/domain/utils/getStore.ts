export function safeJsonParse<T>(json: string): T | undefined {
	try {
		const data = JSON.parse(json) as T
		return data
	} catch (error) {
		return
	}
}

export function getRootStore<T>(key: string): T | undefined {
	const value = figma.root.getPluginData(key)
	return safeJsonParse<T>(value)
}

export function getCurrentPageStore<T>(key: string): T | undefined {
	const value = figma.currentPage.getPluginData(key)
	return safeJsonParse<T>(value)
}

export function setRootStore<T>(key: string, value: T) {
	figma.root.setPluginData(key, JSON.stringify(value))
}

export function setCurrentPageStore<T>(key: string, value: T) {
	figma.currentPage.setPluginData(key, JSON.stringify(value))
}
