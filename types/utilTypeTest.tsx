import type { ExtractProps, NonNullableComponentTypeExtract } from './utilType'

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
