// test code
import { on, once, emit, EventHandler } from '@create-figma-plugin/utilities'
import { useState, useEffect } from 'preact/hooks'

import { rejectCheck, asyncEmit } from '../interface'

import { DuplexType } from '../duplex'

// 어뎁터는 한 번 또는 n번 선언
// 이벤트 리스너에 이벤트가 등록되는 개념이고 메세지가 오면 키 기반으로 payload 랑 함수를 실행하는 개념
// 양방향인데 선언하는 함수가 컴파일 시점에 전송대상이 정해지는 건지가 불분명함

/**
 * 데이터 실제 저장 객체에 저장되는 로직
 * 리엑트의 경우.. 사용해봐야 알 것 같음
 * 키 발행 로직이 따로 필요할 수 있음
 */
export const model = (value: string) => {
	figma.root.setPluginData('main', value)
}

/**
 * 데이터 쓰기 로직 ( 읽기 쓰기, 선택 등 )
 */
export const repository = (obj: Object) => {
	const value = JSON.stringify(obj)
	model(value)
}

/**
 * 구현해야되는 비즈니스 로직
 * 서비스는 서비스를 사용할 수 있음?
 */
export const service = () => {
	const data = {
		hello: 'world',
		count: 123,
	}
	repository(data)
}

/** 일회용 조회 콜 예시 */
const a = async () => {
	const dataTest = await asyncEmit<'user'>('user')
	if (rejectCheck(dataTest)) {
		console.log(dataTest)
	} else {
		console.log('user asyncEmit timeout error')
	}
}
