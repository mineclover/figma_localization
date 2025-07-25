import { Component, type ComponentChildren, h } from 'preact'
import { Suspense } from 'preact/compat'
import { useEffect, useRef, useState } from 'preact/hooks'

// 얕은 비교 함수 구현
function shallowEqual(objA: any, objB: any): boolean {
	if (objA === objB) {
		return true
	}

	if (typeof objA !== 'object' || objA === null || typeof objB !== 'object' || objB === null) {
		return false
	}

	const keysA = Object.keys(objA)
	const keysB = Object.keys(objB)

	if (keysA.length !== keysB.length) {
		return false
	}

	for (let i = 0; i < keysA.length; i++) {
		const key = keysA[i]
		if (!Object.prototype.hasOwnProperty.call(objB, key) || objA[key] !== objB[key]) {
			return false
		}
	}

	return true
}

// API 호출을 위한 리소스 패턴 구현
export const createResource = <T,>(asyncFn: (args: any) => Promise<T>, args: Record<string, any> = {}) => {
	let status = 'pending'
	let result: T
	let error: any

	const promise = asyncFn(args)
		.then(data => {
			status = 'success'
			result = data
		})
		.catch(err => {
			status = 'error'
			error = err
		})

	return {
		read(): T {
			if (status === 'pending') {
				throw promise // Suspense가 이 promise를 캐치
			} else if (status === 'error') {
				throw error // 에러 경계가 이 에러를 캐치
			} else {
				return result // 성공한 경우 데이터 반환
			}
		},
	}
}

// 리소스를 생성하고 제공하는 컴포넌트
export const ResourceProvider = <T,>({
	fetchFn,
	children,
	focusUpdateCount,
	...props
}: {
	focusUpdateCount: number
	fetchFn: (args: any) => Promise<T>
	children: (resource: { read: () => T }) => ComponentChildren
	[key: string]: any
}) => {
	// 이전 props를 저장하기 위한 ref
	const prevPropsRef = useRef<Record<string, any>>(props)

	// 초기 리소스 생성
	const [resource, setResource] = useState(() => createResource(fetchFn, props))

	// props가 변경되면 리소스를 재생성
	useEffect(() => {
		// props가 변경되었는지 확인
		if (!shallowEqual({ ...prevPropsRef.current }, { ...props, focusUpdateCount })) {
			// 새 리소스 생성
			setResource(createResource(fetchFn, props))
			// 이전 props 업데이트
			prevPropsRef.current = { ...props, focusUpdateCount }
		}
	}, [fetchFn, props, focusUpdateCount])

	return children(resource)
}

// 에러 경계 컴포넌트
export class ErrorBoundary extends Component<
	{ children: preact.ComponentChildren },
	{ hasError: boolean; error: Error | null }
> {
	constructor(props: { children: preact.ComponentChildren }) {
		super(props)
		this.state = { hasError: false, error: null }
	}

	static getDerivedStateFromError(error: Error) {
		return { hasError: true, error }
	}

	render() {
		if (this.state.hasError) {
			return (
				<div className="error-message">
					<h2>오류가 발생했습니다</h2>
					<p>{this.state.error?.message || '알 수 없는 오류'}</p>
					<button type="button" onClick={() => this.setState({ hasError: false, error: null })}>
						다시 시도
					</button>
				</div>
			)
		}

		return this.props.children
	}
}

// 사용 예시
type UserData = {
	name: string
	email: string
	phone: string
	website: string
}

// 데이터를 가져오는 함수
const fetchUserData = (args: { userId?: number } = {}): Promise<UserData> => {
	const { userId = 1 } = args

	return fetch(`https://jsonplaceholder.typicode.com/users/${userId}`)
		.then(response => {
			// 선택적으로 로딩 지연 시뮬레이션
			return new Promise(resolve => {
				setTimeout(() => resolve(response), 1500)
			})
		})
		.then(response => {
			if (response instanceof Response) {
				if (!response.ok) {
					throw new Error('Failed to fetch user data')
				}
				return response.json()
			}
			throw new Error('Failed to fetch user data')
		})
}

// 데이터를 표시하는 컴포넌트
const UserProfile = ({ resource }: { resource: { read: () => UserData } }) => {
	const userData = resource.read()

	return (
		<div className="user-profile">
			<h2>사용자 프로필</h2>
			<p>
				<strong>이름:</strong> {userData.name}
			</p>
			<p>
				<strong>이메일:</strong> {userData.email}
			</p>
			<p>
				<strong>전화번호:</strong> {userData.phone}
			</p>
			<p>
				<strong>웹사이트:</strong> {userData.website}
			</p>
		</div>
	)
}

// 앱 컴포넌트 예시
export const App = ({ focusUpdateCount }: { focusUpdateCount: number }) => {
	const [userId, setUserId] = useState(1)

	return (
		<div className="app">
			<h1>Preact Suspense와 API 호출 예제</h1>

			<div>
				<label htmlFor="user-select">사용자 선택: </label>
				<select
					id="user-select"
					value={userId}
					onChange={e => setUserId(parseInt((e.target as HTMLSelectElement).value, 10))}
				>
					{[1, 2, 3, 4, 5].map(id => (
						<option key={id} value={id}>
							사용자 {id}
						</option>
					))}
				</select>
			</div>

			<ErrorBoundary>
				<ResourceProvider fetchFn={fetchUserData} userId={userId} focusUpdateCount={focusUpdateCount}>
					{resource => (
						<Suspense fallback={<div className="loading">데이터를 불러오는 중...</div>}>
							<UserProfile resource={resource} />
						</Suspense>
					)}
				</ResourceProvider>
			</ErrorBoundary>
		</div>
	)
}
