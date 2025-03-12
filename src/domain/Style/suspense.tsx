import { h, render } from 'preact';
import React from 'preact/compat';
import { Suspense } from 'preact/compat';
import { useState, useEffect } from 'preact/hooks';

// API 호출을 위한 리소스 패턴 구현
export const createResource = <T extends unknown>(asyncFn: () => Promise<T>) => {
	let status = 'pending';
	let result: T;
	let promise = asyncFn()
		.then((data) => {
			status = 'success';
			result = data;
		})
		.catch((error) => {
			status = 'error';
			result = error;
		});

	return {
		read() {
			if (status === 'pending') {
				throw promise; // Suspense가 이 promise를 캐치
			} else if (status === 'error') {
				throw result; // 에러 경계가 이 에러를 캐치
			} else {
				return result; // 성공한 경우 데이터 반환
			}
		},
	};
};

// 리소스를 생성하고 제공하는 컴포넌트
export const ResourceProvider = <T extends unknown>({
	fetchFn,
	children,
}: {
	fetchFn: () => Promise<T>;
	children: (resource: { read: () => T }) => React.ReactNode;
}) => {
	// 컴포넌트가 마운트될 때만 리소스를 생성
	const resource = useState(() => createResource(fetchFn))[0];

	return children(resource);
};

// 데이터를 가져오는 함수
const fetchUserData = (): Promise<{
	name: string;
	email: string;
	phone: string;
	website: string;
}> => {
	return fetch('http://localhost:6543/system/status')
		.then((response) => {
			// 로딩 시간을 시뮬레이션하기 위한 인위적인 지연
			return new Promise((resolve) => {
				setTimeout(() => resolve(response), 1500);
			});
		})
		.then((response: unknown) => {
			if (!(response instanceof Response)) {
				throw new Error('Invalid response type');
			}
			if (!response.ok) {
				throw new Error('Failed to fetch user data');
			}
			return response.json();
		});
};

// 데이터를 표시하는 컴포넌트
const UserProfile = ({
	resource,
}: {
	resource: {
		read: () => {
			name: string;
			email: string;
			phone: string;
			website: string;
		};
	};
}) => {
	// 리소스에서 데이터 읽기
	const userData = resource.read();

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
	);
};

// 에러 경계 컴포넌트
export class ErrorBoundary extends React.Component {
	constructor(props: {} | undefined) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: any) {
		return { hasError: true, error };
	}
	render() {
		if ((this.state as { hasError: boolean; error: Error }).hasError) {
			return (
				<div className="error-message">
					<h2>오류가 발생했습니다</h2>
					<p>{(this.state as { hasError: boolean; error: Error }).error.message}</p>
					<button onClick={() => this.setState({ hasError: false })}>다시 시도</button>
				</div>
			);
		}

		return this.props.children;
	}
}

// 추가 컴포넌트 예시
const PostComponent = ({ resource }: { resource: any }) => {
	const postData = resource.read();

	return (
		<div className="post">
			<h3>{postData.title}</h3>
			<p>{postData.body}</p>
		</div>
	);
};

// 메인 앱 컴포넌트 예시
export const App = () => {
	// 포스트 데이터를 가져오는 함수
	const fetchPostData = () => {
		return fetch('https://jsonplaceholder.typicode.com/posts/1')
			.then((response) => new Promise((resolve) => setTimeout(() => resolve(response), 1000)))
			.then((response) => {
				if (!(response instanceof Response)) {
					throw new Error('Failed to fetch post data');
				}
				if (!response.ok) {
					throw new Error('Failed to fetch post data');
				}
				return response.json();
			});
	};

	return (
		<div className="app">
			<h1>Preact Suspense와 API 호출 예제</h1>

			<ErrorBoundary>
				<ResourceProvider fetchFn={fetchUserData}>
					{(resource) => (
						<Suspense fallback={<div className="loading">데이터를 불러오는 중...</div>}>
							<UserProfile resource={resource} />
						</Suspense>
					)}
				</ResourceProvider>
			</ErrorBoundary>

			{/* 다른 데이터를 가져오는 예시 */}
			<ErrorBoundary>
				<ResourceProvider fetchFn={fetchPostData}>
					{(resource) => (
						<Suspense fallback={<div className="loading">포스트 데이터를 불러오는 중...</div>}>
							<PostComponent resource={resource} />
						</Suspense>
					)}
				</ResourceProvider>
			</ErrorBoundary>
		</div>
	);
};
