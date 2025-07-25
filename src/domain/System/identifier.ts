export const StatusByCode = {
	a: 'default',
	b: 'first',
	c: 'second',
	d: 'third',
	e: 'fourth',
	f: 'fifth',
	g: 'sixth',
	h: 'seventh',
	i: 'eighth',
	j: 'ninth',
	k: 'tenth',
	l: 'eleventh',
	m: 'twelfth',
} as const

export const StatusByString = Object.fromEntries(Object.entries(StatusByCode).map(([key, value]) => [value, key])) as {
	[key in (typeof StatusByCode)[keyof typeof StatusByCode]]: keyof typeof StatusByCode
}

export type StatusCode = keyof typeof StatusByCode
export type StatusString = (typeof StatusByCode)[keyof typeof StatusByCode]
