type Mode = 'dev' | 'build'
// const mode = "build";
const mode = 'build'

type Category = 'svg' | 'token' | 'debug' | 'gradient'

const currentCartegory: Category = 'gradient'

export const LLog = (category: string, ...args: any[]) => {
	//@ts-ignore
	if (category === currentCartegory && mode === 'dev') {
		return console.log(...args)
	}
	return () => {}
}
