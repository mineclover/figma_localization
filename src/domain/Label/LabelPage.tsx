import { h } from 'preact';
import styles from './Label.module.css';
import { useLabelActions } from './useLabelActions';
import {
	Bold,
	Button,
	IconActionChangeSmall24,
	IconBooleanSubtract24,
	IconBooleanUnion24,
	IconButton,
	IconChevronDownLarge24,
	IconDropShadowMidSmall24,
	IconEyeSmall24,
	IconHiddenSmall24,
	IconInsert24,
	Textbox,
} from '@create-figma-plugin/ui';
import { clc } from '@/components/modal/utils';
import { useEffect, useState } from 'preact/hooks';
import { useFetch } from '@/hooks/useFetch';
import {
	autoCurrentNodesSignal,
	autoCurrentNodeStyleSignal as autoCurrentNodeBaseSignal,
	currentPointerSignal,
	searchStoreLocationSignal,
} from '@/model/signal';
import { useSignal } from '@/hooks/useSignal';
import { emit } from '@create-figma-plugin/utilities';
import {
	DISABLE_RENDER_PAIR,
	RENDER_PAIR,
	RENDER_TRIGGER,
	SAVE_ACTION,
	TRANSLATION_ACTION_PAIR,
	UPDATE_BASE_NODE,
} from '../constant';
import { modeStateSignal } from '@/model/signal';
import SimpleSelect, { nextBaseSignal } from '../Batch/SimpleSelect';
import { KeyIds } from './KeyIds';
import { Preset } from './Preset';

// 활성화와 새로고침의 기능이 같음
// 선택 적용 옵션은 모든 저장에 적용할 수 있음
function LabelPage() {
	const modeState = useSignal(modeStateSignal);
	const currentPointer = useSignal(currentPointerSignal);
	const searchStoreLocation = useSignal(searchStoreLocationSignal);
	const nextBase = useSignal(nextBaseSignal);
	const { baseNodeId, nodeId, pageId, projectId } = nextBase;

	const autoCurrentNodes = useSignal(autoCurrentNodesSignal);
	const autoCurrentBaseNode = useSignal(autoCurrentNodeBaseSignal);

	const selectLocation = searchStoreLocation.get(autoCurrentBaseNode);
	const selectNodeData = autoCurrentNodes.find((item) => item.id === selectLocation?.node_id);
	const { dispatch, actions } = useLabelActions();
	return (
		<div className={styles.container}>
			<div className={styles.row}>
				<IconButton
					onClick={() => dispatch(actions.renderPair())}
				>
					<IconEyeSmall24></IconEyeSmall24>
				</IconButton>
				{/* 비활성화 */}
				<IconButton
					onClick={() => dispatch(actions.disableRender())}
				>
					<IconHiddenSmall24 />
				</IconButton>
			</div>

			<Bold>섹션</Bold>
			<div className={styles.row}>
				<Button
					onClick={() => dispatch(actions.selectExcludedSection())}
				>
					제외된 섹션 선택
				</Button>
				<IconButton
					onClick={() => dispatch(actions.insertAction([
						'insert',
						'default, hover 등등',
						'test'
					]))}
				>
					<IconInsert24 />
				</IconButton>
				<IconButton
					onClick={() => dispatch(actions.unionAction([
						'union',
						'default, hover 등등',
						'test'
					]))}
				>
					<IconBooleanUnion24 />
				</IconButton>
				<IconButton
					onClick={() => dispatch(actions.subtractAction([
						'subtract',
						'default, hover 등등',
						'test'
					]))}
				>
					<IconBooleanSubtract24 />
				</IconButton>
				{/* 활성화 */}
			</div>
			<Preset />
			<SimpleSelect />
			<span>{modeState}</span>

			<span>선택할 수 있는 전체 키 목록</span>
			<KeyIds
				localizationKey={selectNodeData?.localizationKey ?? ''}
				action={'default'}
				text={selectNodeData?.text ?? ''}
				prefix="test"
			/>

			{/* <Button
					onClick={() => {
						emit(UPDATE_BASE_NODE.REQUEST_KEY, baseNodeId, { nodeId, pageId, projectId });
					}}
				>
					베이스만 적용
				</Button> */}
		</div>
	);
}
export default LabelPage;
