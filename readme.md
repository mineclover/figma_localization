# log

## 25-04-18

데이터베이스 쪽 서버는 갈아 엎을 생각하는게 맞음 api 처음부터 다시 짤 가능성 높음

## 25-04-25

### baseNodeId 최초 등록

textOriginRegister > idsBaseAll 에서 시작 됨

# baseNode 표시는 baseNodeHighlight

# 박스 오버레이 lzTextOverlay

## 오버레이 프레임의 메타데이터 getFrameNodeMetaData

# 일단 오버레이 될 때 메타데이터는 일시적으로 하나로 통일 됨

이는 오버레이가 전체 새로고침 되기 전까지 유지 됨
오버레이 프레임에는 임시 값이 저장되고 텍스트 노드에 영구저장 되는 개념

이 코드가 들어가면 선택 된게 없을 때 선택에 의한 변화는 초기화 됨

```js
if (backgroundFrame) {
	await overlayRender();
}
```
