// Components.jsx
import { effect, batch } from '@preact/signals-core'
import { useEffect, useState } from 'preact/hooks'
import { count, multiplier, price, doubleCount, total } from './signals'
import { h } from 'preact'
import { userAtom } from '@/domain/user/userModel'

// 부모 컴포넌트
export function Parent() {
	// effect를 사용해 변경 추적
	const [parentCount, setParentCount] = useState(0)
	effect(() => {
		console.log(`Parent: count changed to ${count.value}`)
		setParentCount(count.value)
	})
	effect(() => {
		console.log(`UserAtom: count changed to ${userAtom.value}`)
	})

	return (
		<div className="p-4">
			<h1>시그널 전파 데모 {parentCount}</h1>
			{JSON.stringify(userAtom.value)}
			<User />
			<Counter />
			<Multiplier />
			<Price />
			<Results />
		</div>
	)
}

// 카운터 컴포넌트
function Counter() {
	const [innerCount, setInnerCount] = useState(0)
	// effect(() => {
	// 	console.log(`Parent: count changed to ${count}`)
	// 	setCount(count)
	// })

	useEffect(() => {
		const fetchInitialData = async () => {
			try {
				count.value = 1
				multiplier.value = 2
				price.value = 1000
			} catch (error) {
				console.error('초기값 로딩 실패:', error)
			}
		}

		fetchInitialData()
	}, [])

	effect(() => {
		console.log(`Counter: count updated to ${count.value}`)
		setInnerCount(count.value)
	})

	// batch를 사용하여 여러 업데이트를 한 번에 처리
	const updateMultiple = () => {
		batch(() => {
			count.value++
			multiplier.value += 1
		})
	}

	return (
		<div className="mb-4">
			<h2>카운터 {innerCount}</h2>
			<p>현재 값: {count.value}</p>
			<button onClick={() => count.value++}>증가</button>
			<button onClick={updateMultiple}>카운트와 승수 동시 증가</button>
		</div>
	)
}

// 승수 컴포넌트
function Multiplier() {
	effect(() => {
		console.log(`Multiplier: multiplier changed to ${multiplier.value}`)
	})

	return (
		<div className="mb-4">
			<h2>승수</h2>
			<p>현재 승수: {multiplier}</p>
			<button onClick={() => multiplier.value++}>승수 증가</button>
		</div>
	)
}

// 가격 컴포넌트
function Price() {
	return (
		<div className="mb-4">
			<h2>가격</h2>
			<p>단가: {price}</p>
			<button onClick={() => (price.value += 500)}>가격 증가</button>
		</div>
	)
}

// 결과 표시 컴포넌트
function Results() {
	effect(() => {
		console.log(`Results: total updated to ${total.value}`)
	})

	return (
		<div className="mb-4">
			<h2>결과</h2>
			<p>두 배 값: {doubleCount}</p>
			<p>총 금액: {total}</p>
		</div>
	)
}

function User() {
	effect(() => {
		console.log('UserAtom 값 변경:', userAtom.value)
	})

	if (!userAtom.value) {
		return <div>로딩 중...</div>
	}

	return (
		<div className="mb-4">
			<p>유저 이름: {userAtom.value.name}</p>
			<p>유저 UUID: {userAtom.value.uuid}</p>
		</div>
	)
}
