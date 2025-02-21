export type HandlerParameters<T extends EventHandler> = Parameters<T['handler']>
export type Handler<T extends EventHandler> = (...args: HandlerParameters<T>) => void

export type Prettify<T> = {
	[K in keyof T]: T[K]
} & {}

/**
 * 함수의 첫 번째 매개변수 타입을 추출하는 유틸리티 타입
 * 
 * type JSX_A = FirstParameter<(a:string)=>void>

 *  */
export type FirstParameter<T extends (...args: any) => any> = T extends (first: infer P, ...args: any) => any
	? P
	: never

/**
 * 첫번째 제네릭으로 넘어온 JSX 객체의 전체 타입 추론
 * 
 * type Props = {
  hello: string
}

const UtilTypeTest = ({hello}: Props) => {
  return (
    <div>{hello}</div>
  )
}

const JSXGroups = {
  a: UtilTypeTest,
};

type JSX_A = ExtractProps<typeof JSXGroups, "a">;
* type Props를 추론함
 *  */
export type ExtractProps<T, K extends keyof T> = T[K] extends (props: infer P) => any ? P : never

/**
 * object로 감싸지 않고 그냥 JSX 해싱
 * type JSX_B = SingleExtractProps<(typeof JSXGroups)["a"]>;
 * >> type Props 를 추론함
 */
export type SingleExtractProps<T> = T extends (props: infer P) => any ? P : never

// 가장 컴포넌트의 첫번째 파라미터인(props)를 추출
export type ExtractComponentTypeProps<T> =
	T extends React.ComponentType<infer P> ? P : T extends (...args: any[]) => any ? Parameters<T>[0] : never

/**
 * 리엑트 컴포넌트의 props에서 K 타입을 NonNullable로 추출
 * event: Parameters<NonNullableComponentTypeExtractProps<typeof Tabs, "onChange">>[0]
 * event: Parameters<NonNullable<JSX.IntrinsicElements['input']['onChange']>>[0]
 */
export type NonNullableComponentTypeExtract<T, K extends keyof ExtractComponentTypeProps<T>> = NonNullable<
	ExtractComponentTypeProps<T>[K]
>
