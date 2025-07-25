import { useDispatch } from '@/hooks/useDispatch';
import { emit } from '@create-figma-plugin/utilities';
import {
  RENDER_PAIR,
  DISABLE_RENDER_PAIR,
  RENDER_TRIGGER,
  SAVE_ACTION,
  UPDATE_BASE_NODE,
  TRANSLATION_ACTION_PAIR,
} from '../constant';

export type LabelActionPayloads = {
  renderPair: undefined;
  disableRender: undefined;
  selectExcludedSection: undefined;
  insertAction: [localizationKey: string, action: string, baseNodeId: string];
  unionAction: [localizationKey: string, action: string, baseNodeId: string];
  subtractAction: [localizationKey: string, action: string, baseNodeId: string];
  updateBaseNode: { baseNodeId: string; nodeId: string; pageId: string; projectId: string };
};

export function useLabelActions() {
  const actions = {
    renderPair: () => {
      emit(RENDER_PAIR.RENDER_REQUEST);
    },
    
    disableRender: () => {
      emit(DISABLE_RENDER_PAIR.DISABLE_RENDER_REQUEST);
    },
    
    selectExcludedSection: () => {
      emit(RENDER_TRIGGER.SECTION_SELECT);
    },
    
    insertAction: ([localizationKey, action, baseNodeId]: LabelActionPayloads['insertAction']) => {
      emit(RENDER_TRIGGER.SAVE_ACTION, SAVE_ACTION.INSERT, {
        localizationKey,
        action,
        baseNodeId,
      });
    },
    
    unionAction: ([localizationKey, action, baseNodeId]: LabelActionPayloads['unionAction']) => {
      emit(RENDER_TRIGGER.SAVE_ACTION, SAVE_ACTION.UNION, {
        localizationKey,
        action,
        baseNodeId,
      });
    },
    
    subtractAction: ([localizationKey, action, baseNodeId]: LabelActionPayloads['subtractAction']) => {
      emit(RENDER_TRIGGER.SAVE_ACTION, SAVE_ACTION.SUBTRACT, {
        localizationKey,
        action,
        baseNodeId,
      });
    },
    
    updateBaseNode: ({ baseNodeId, nodeId, pageId, projectId }: LabelActionPayloads['updateBaseNode']) => {
      emit(UPDATE_BASE_NODE.REQUEST_KEY, baseNodeId, { nodeId, pageId, projectId });
    },
  };

  return useDispatch(actions);
}