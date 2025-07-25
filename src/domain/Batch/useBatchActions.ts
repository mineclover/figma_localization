import { useDispatch } from '@/hooks/useDispatch';
import { emit } from '@create-figma-plugin/utilities';
import { 
  SET_NODE_IGNORE, 
  GET_PATTERN_MATCH_KEY,
  SET_NODE_LOCALIZATION_KEY_BATCH,
  UPDATE_NODE_LOCALIZATION_KEY_BATCH,
  GET_LOCALIZATION_KEY_VALUE
} from '../constant';
import { selectIdsSignal, inputKeySignal, selectedKeySignal } from '@/model/signal';
import { pageNodeZoomAction } from '@/figmaPluginUtils/utilAction';
import { keyConventionRegex } from '@/utils/textTools';
import { Dispatch, StateUpdater } from 'preact/hooks';

export type BatchActionPayloads = {
  toggleNodeIgnore: { ignore: boolean; ids: string[] };
  toggleIdSelection: { id: string; selectIds: string[] };
  toggleAllIdsSelection: { ids: string[]; selectIds: string[] };
  selectIds: { ids: string[] };
  zoomToNode: { id: string };
  refreshPatternMatch: undefined;
  searchKey: [key: string, setSearch: (key: string) => void, setTabValue: Dispatch<StateUpdater<string>>];
  clearKeySelection: [setSearch: (key: string) => void];
  updateLocalizationKey: [
    hasSelectedKey: boolean,
    selectedKeyData: any,
    selectIds: string[],
    domainSetting: any,
    localizationKey: string,
    currentPointer: any,
    fetchData: any
  ];
};

export function useBatchActions() {
  const actions = {
    toggleNodeIgnore: ({ ignore, ids }: BatchActionPayloads['toggleNodeIgnore']) => {
      emit(SET_NODE_IGNORE.REQUEST_KEY, { ignore, ids });
      emit(GET_PATTERN_MATCH_KEY.REQUEST_KEY);
    },
    
    toggleIdSelection: ({ id, selectIds }: BatchActionPayloads['toggleIdSelection']) => {
      if (selectIds.includes(id)) {
        selectIdsSignal.value = selectIds.filter((selectedId) => selectedId !== id);
      } else {
        selectIdsSignal.value = [...selectIds, id];
      }
    },
    
    toggleAllIdsSelection: ({ ids, selectIds }: BatchActionPayloads['toggleAllIdsSelection']) => {
      const hasAnyId = ids.some((id) => selectIds.includes(id));
      if (hasAnyId) {
        selectIdsSignal.value = selectIds.filter((id) => !ids.includes(id));
      } else {
        selectIdsSignal.value = [...selectIds, ...ids];
      }
    },
    
    selectIds: ({ ids }: BatchActionPayloads['selectIds']) => {
      selectIdsSignal.value = ids;
      emit('PAGE_SELECT_IDS', { ids });
    },
    
    zoomToNode: ({ id }: BatchActionPayloads['zoomToNode']) => {
      pageNodeZoomAction(id);
    },
    
    refreshPatternMatch: () => {
      emit(GET_PATTERN_MATCH_KEY.REQUEST_KEY);
    },
    
    searchKey: ([key, setSearch, setTabValue]: BatchActionPayloads['searchKey']) => {
      const normalizedKey = keyConventionRegex(key);
      inputKeySignal.value = normalizedKey;
      setSearch(normalizedKey);
      setTabValue('Search');
    },
    
    clearKeySelection: ([setSearch]: BatchActionPayloads['clearKeySelection']) => {
      setSearch('');
      selectedKeySignal.value = null;
      inputKeySignal.value = '';
    },
    
    updateLocalizationKey: async ([
      hasSelectedKey, 
      selectedKeyData, 
      selectIds, 
      domainSetting, 
      localizationKey, 
      currentPointer,
      fetchData 
    ]: BatchActionPayloads['updateLocalizationKey']) => {
      
      if (hasSelectedKey) {
        const isOriginNull = selectedKeyData?.origin_value == null || selectedKeyData.origin_value === '';
        
        emit(UPDATE_NODE_LOCALIZATION_KEY_BATCH.REQUEST_KEY, {
          domainId: selectedKeyData?.domain_id,
          keyId: selectedKeyData?.key_id,
          originId: isOriginNull ? null : selectedKeyData?.origin_id,
          ids: selectIds,
        });
        emit(GET_PATTERN_MATCH_KEY.REQUEST_KEY);
      } else {
        const result = await fetchData('/localization/keys', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            domainId: domainSetting.domainId,
            name: localizationKey,
            isTemporary: true,
          }),
        });

        if (result.data) {
          emit(
            SET_NODE_LOCALIZATION_KEY_BATCH.REQUEST_KEY,
            {
              domainId: result.data.domain_id,
              keyId: result.data.key_id,
              ids: selectIds,
            },
            currentPointer?.nodeId
          );
          emit(GET_PATTERN_MATCH_KEY.REQUEST_KEY);
        }
      }
    },
  };

  return useDispatch(actions);
}