# 에셋 정리

[아이콘 스토리북](https://yuanqing.github.io/create-figma-plugin/storybook/?path=/story/icons-size-8--control-chevron-down)
Layer 로 시작하는거 많이 쓸 것 같음

[css 참고](https://www.figma.com/plugin-docs/css-variables/)

# 컨벤션

- [히스토리](history.md)에 변경 사항 기록하기
- adapter 가 단순한 것은 의도 됨
- payload action 등을 통해 복잡하게 구성할 수도 있지만 그러지 않도록 데이터를 파편화하는 것을 전재로 함

# 기능 추가 주제

주제로 설계 해보고 적합한지 판단

## UI 선택지

- 카테고리 탭바 말고 셀렉트를 주는 건 어떤가
  - 카테고리 탭바는 너무 길어서 셀렉트를 주는 걸로 해보는 것도 좋을 것 같음
- 제목 구간 접기

  - 너무 기니까 접어두고 필요하면 펼쳐 보는 건 어떤가라는 주제

  너무 많은 정보를 전달하고 있으니 접어두는 것에 대한 이야기임

  하지만 기존 탭바에서 갯수를 보여주는 기능이 유용하기 때문에 사이드바 등으로 처리하는 것도 같이 고려됨

## 컴포넌트 메모 관리

- 꼭 페이지 이름에서부터 내려오는 경로가 아니라 이 섹션이 무엇이다를 정의하기 위해서

- 컴포넌트 메모 기존 기능을 살려서 작업하는 것도 좋은 방법이라 생각함
  - 컴포넌트는 고유성이 존재한다는 전재하에 컴포넌트를 섹션으로 두고 메모하는 방식 채용
    - [ ] 이런 구조로 가게 되면 기존에 개발했던 현재 컴포넌트를 path에 수집하던 구조를 조정할 수 있음
    - 컴포넌트 메모 뷰 모드를 추가해서 관리하는 것도 좋아보임
      - 디자인 탭을 fix처럼 고정으로 만들고 해당 뷰에서만 작업하는 것도 좋아보임
      - 이유는 컴포넌트에 대해 설명을 추가하는게 디자인 뿐이지 않을까

## 히스토리

뒤로가기버튼을 구현하는 것
컴포넌트 이동 시 히스토리 관리

## 개인화 메모고정 탭 구성

- hot은 공용이고 개인용 고정 메모 페이지를 두자는 내용

## 컴포넌트 간 이동에서 메모 유지해야하는가

주제 선정 이유

- 메모에 컴포넌트를 추가할 경우 선택 섹션도 변경됨
  - 이동 시 섹션이 변경되므로 기존에 보이던 메모들이 없어질 것임
- 컴포넌트 추가에는 제한이 없음
- 사라지는 게 불편한가? 불편하다
- 원래 보던 뷰에서 벗어나는 것도 불편하다
- 나와야할 게 안나오는 것도 불편하다

방법

- 보정하기보단 컴포넌트 포커스로 이동 시 기존 컴포넌트 1개를 상단에 고정하는 것을 고려할 수 있음 메모의 기능을 연속적으로 사용할 수 있게 하는 것이 목적
- 메모를 추가할 때 첫번째 컴포넌트를 고정하는 것으로 구성함으로 안정적으로 돌아갈 수 있게 함
  - 물론 등록에 기반한 거라 섹션 명이 같고 다른 위치에 있으면 원래 보던 뷰로 돌아가진 않을 수 있음

구현 방법

- 메모 키 기반으로 컴포넌트 추가 시 첫번째 컴포넌트를 고정하는 것으로 구성
- 메모를 고정하는게 1차 기능
- 이전 컴포넌트를 고정하는 것도 가능한데
  - 메모 제공 안해주면 편의적으로 불편할 것이라 생각
    - 컴포넌트 간 이동에 대해 연속성을 주고 싶음
    - 메모 뷰어 ui를 보고 선택해야할 것 같음

# 기능 정의

![alt text](docs/image-2.png)

## 필터 기능

- 전체 메모를 볼 것인지 여부 (기본 값 : false)
- 유지할 최대 섹션 수 > 섹션 기준으로 포커스 필터링 되는 구조에서 메모를 얼마나 볼 것인지 (기본 값 : 1) , (0 : 비활성)
- 선택된 것을 기준으로 하위 섹션이 보여지게 할 것인지 여부
- 제목 검색
- 작성자 검색? UUID만 저장하고 있어서 성능 부하 있을 듯 > UUID 리스트에서 찾아서 매칭해서 찾아야하는 구조라..
  - 작성자를 선택하게 해서 정확한 이름으로만 찾게 하는 것이 성능적으로 좋아보임
-

- 메모 뷰어 자체가 화면의 현재 위치가 가지는 섹션 정보에 해당하는 메모만 보여주기 떄문에 카테고리를 상단 탭에 두는 구조가 성립할 수 있다고 생각했음
  - 섹션 길이가 더 길어서 ...
  - 섹션 리스트 뷰를 만드는 것도 좋은 생각..

## 기능 변경 사항

- 세션 포커스 기능 필터에 포함
- pub 기능 추가
  - 너무 업데이트를 최소화 시켜서 다른 유저의 업데이트를 받지 못하는 문제가 있었음
  - [system 도메인 신설](src\domain\system\systemAdapter.ts)
  - 새로고침 추가하게 되면 Signal_pub 보내면 되도록 구성

# 고도화 주제

데이터베이스를 완전히 외부로 두는 게 가능함
API를 쏘거나 외부에 배포된 웹 페이지에 접속하는 것도 가능한 사례가 있기 때문임

이를 기반으로 데이터베이스를 외부로 두고 데이터를 처리하는 것을 고려해볼 수 있음

이렇게 되면 메모 시스템을 더 안정적이게 만들 수 있게 되고 기업용에 맞게 설계할 수 있어짐

하지만 그만큼 설계가 복잡해지고 비용이 많이 들어갈 것임

시간 투자에 대한 인가가 필요함

# 아키텍처 컨벤션

![alt text](docs/image-1.png)

[Types/Spec](#Types/Spec) 에서  
개발하고자하는 서비스에서 도메인을 위해 정의되는 데이터에 대한 타입 정의를 한다

지금 프로젝트의 경우  
main 또는 ui 를 위한 인터페이스를 만들고

메세지 프로토콜을 위한 이벤트 리스너를 생성한다  
이벤트 리스너 자체가 어떤 행동이 발생하기 위한 조건을 담고 있는 경우가 많다  
그렇기에 추상화된 행동을 정의하며 [Adapter](#adapter) 에 작서할 수 있다

- 리스너 또는 이미터 선언 로직을 담으면 된다
- 프로토콜 관련된 타입도 이곳에

[Adapter](#adapter) 를 트리거로 하거나 [Adapter](#adapter) 로 인한 데이터 변경을 트리거로 [Service](#service) 를 실행 시킬 수 있다  
[Service](#service) 는 [Repository](#repository) 를 통해 [Model](#model) 에서 데이터를 받거나  
[Adapter](#adapter) 가 받아온 데이터를 기반으로 수행하고자하는 로직을 처리한 후

다음 동작으로 연결 시킨다 [View](#view) 나 [Repository](#repository) 로 연결하거나 다른 [Service](#service) 도 가능

# Logic

이번에 시도해볼 아키텍처 구성 특징은
일단 어뎁터, 서비스, 레포지토리, 모델 , view 로 용도분리를 하고
도메인이 분리되있으면 보기 힘드니 데이터를 도메인으로 잡고 도메인 단위로 묶어서 구성했음

## Types/Spec

- 모든 레이어가 공유하는 인터페이스와 타입 정의

## Adapter

- 외부 시스템과의 통합 구현
- 주로 post 메세지 처리 할 것임
- 특정 [Service](#service) 를 실행시키기 위한 트리거로도 동작

## Service

- 핵심 비즈니스 로직 구현
- 트랜잭션 처리 ... 였으나 page에서는 state를 어뎁터에서 핸들링하고 바로처리하다보니 유명 무실해짐
  - 만약 ui나 기타에서 데이터 처리 일부를 서비스 레이어로 분리하게 되면 쓰기 좋을 것 같음
- [Repository](#repository) 와 [Adapter](#adapter) 조합

## Repository

- 데이터 접근 추상화
- [Model](#model) 을 사용해서 데이터에 접근하는 것
- 입/출력 처리

## Model

- 도메인 엔티티와 값 객체
- 비즈니스 규칙과 제약조건들
- 직접적인 데이터 처리 로직
- 스토어가 하나인 상황에서 제약조건으로 락킹 분리하는 목적으로 쓰는게 목적

# View

## apps

- 배포 폴더로 사용
- ui.tsx 랑 main.tsx

## pages

- 페이지 컴포넌트 분리용

## components

- 리엑트 컴포넌트들

## controller

- 주로 데이터 핸들링하는 로직들

# 적용 예시

```ts
import { on, EventHandler } from '@create-figma-plugin/utilities'

interface adapterSampleHandler extends EventHandler {
	name: 'SAMPLE'
	handler: (count: number) => void
}

// 어뎁터는 한 번 또는 n번 선언
// 이벤트 리스너에 이벤트가 등록되는 개념이고 메세지가 오면 키 기반으로 payload 랑 함수를 실행하는 개념
// 양방향인데 선언하는 함수가 컴파일 시점에 전송대상이 정해지는 건지가 불분명함
// 전송 주체 기준으로 figma <=> ui 가 능동적임

export type HandlerParameters<T extends EventHandler> = Parameters<T['handler']>
export type Handler<T extends EventHandler> = (...args: HandlerParameters<T>) => void

type parametersType = HandlerParameters<adapterSampleHandler>
type handlerType = Handler<adapterSampleHandler>

/**
 * 데이터 실제 저장 로직 (reducer)
 * 리엑트의 경우.. 사용해봐야 알 것 같음
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
 */
export const service: handlerType = (count) => {
	const data = {
		hello: 'world',
		count: count,
	}
}

/**
 * 저장하는 adapter main에는 adapter 만 넣어야 함
 * 실행 한 번에 리스너 등록 한 번
 */
export const adapter = () => {
	on<adapterSampleHandler>('SAMPLE', service)
}
```
