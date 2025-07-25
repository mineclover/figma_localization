import {
	Button,
	Code,
	Columns,
	Container,
	IconPlusSmall24,
	IconPrototyping24,
	Muted,
	render,
	Text,
	TextboxMultiline,
	TextboxNumeric,
	VerticalSpace,
} from '@create-figma-plugin/ui'
import { h } from 'preact'
import { type ExtractProps, type NonNullableComponentTypeExtract, SingleExtractProps } from './utilType'

type Props = {
	hello: string
}

function UtilTypeTest({ hello }: Props) {
	return <div>{hello}</div>
}

const JSXGroups = {
	a: UtilTypeTest,
}

type JSX_A = ExtractProps<typeof JSXGroups, 'a'>

type JSX_B = NonNullableComponentTypeExtract<(typeof JSXGroups)['a'], 'hello'>

export default UtilTypeTest
