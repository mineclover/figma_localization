// https://yuanqing.github.io/create-figma-plugin/quick-start/
module.exports = function (buildOptions) {
	return {
		...buildOptions,
		// ...
		alias: {
			'!../css/base.css': './node_modules/@create-figma-plugin/ui/lib/css/base.css',
			strnum: './node_modules/strnum/strnum.js',
		},
	}
}
