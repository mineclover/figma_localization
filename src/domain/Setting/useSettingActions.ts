import { useDispatch } from '@/hooks/useDispatch';
import { emit } from '@create-figma-plugin/utilities';
import {
  SET_LANGUAGE_CODES,
  SET_PROJECT_ID,
  GET_PROJECT_ID,
  SET_USER_HASH_PAIR,
  GET_USER_HASH_PAIR,
  SET_API_KEY_PAIR,
} from '../constant';
import { languageCodesSignal, projectIdSignal, userHashSignal, apiKeySignal, domainSettingSignal } from '@/model/signal';
import { modalAlert } from '@/components/alert';
import { clientFetchDBCurry } from '../utils/fetchDB';

export type SettingActionPayloads = {
  refreshDomains: [fetchData: (url: string, options: any) => Promise<any>];
  updateLanguageCodes: [
    languageCodes: string[], 
    domainSetting: any,
    fetchData: (url: string, options: any) => Promise<any>
  ];
  addDomain: [
    domainName: string,
    domainSetting: any,
    fetchData: (url: string, options: any) => Promise<any>
  ];
  setProjectId: [url: string];
  getProjectId: undefined;
  setUserHash: [userHash: string];
  getUserHash: undefined;
  setApiKey: [apiKey: string];
  updateLanguageCode: { oldCode: string; newCode: string };
  addLanguageCode: undefined;
};

export function useSettingActions() {
  const actions = {
    refreshDomains: async ([fetchData]: SettingActionPayloads['refreshDomains']) => {
      await fetchData('/domains', {
        method: 'GET',
      });
    },
    
    updateLanguageCodes: async ([languageCodes, domainSetting, fetchData]: SettingActionPayloads['updateLanguageCodes']) => {
      const clientFetch = clientFetchDBCurry(domainSetting?.domainId!);
      
      await clientFetch(
        ('/domains/' + domainSetting?.domainName + '/languages') as '/domains/{name}/languages',
        {
          method: 'PUT',
          body: JSON.stringify({
            languageCodes: languageCodes.filter((item) => item != ''),
          }),
        }
      );
      
      await fetchData('/domains', {
        method: 'GET',
      });
    },
    
    addDomain: async ([domainName, domainSetting, fetchData]: SettingActionPayloads['addDomain']) => {
      if (domainName === '') {
        modalAlert('도메인 이름을 입력해주세요.');
        return;
      }

      const clientFetch = clientFetchDBCurry(domainSetting?.domainId!);
      const result = await clientFetch('/domains', {
        method: 'POST',
        body: JSON.stringify({
          domain: domainName.trim(),
        }),
      });
      
      if (result.status === 200) {
        modalAlert('도메인 추가 완료');
        await fetchData('/domains', {
          method: 'GET',
        });
      } else {
        const error = await result.json();
        if (error.details.includes('UNIQUE constraint failed')) {
          modalAlert('이미 존재하는 도메인 이름입니다.');
        } else {
          modalAlert(error.details);
        }
      }
    },
    
    setProjectId: ([url]: SettingActionPayloads['setProjectId']) => {
      const regex = /https:\/\/www\.figma\.com\/design\/([^/]+)\//;
      const match = url.match(regex);
      const designId = match ? match[1] : null;
      projectIdSignal.value = 'loading';
      
      if (designId) {
        emit(SET_PROJECT_ID.REQUEST_KEY, designId);
      } else {
        projectIdSignal.value = '유효하지 않은 값';
      }
    },
    
    getProjectId: () => {
      emit(GET_PROJECT_ID.REQUEST_KEY);
    },
    
    setUserHash: ([userHash]: SettingActionPayloads['setUserHash']) => {
      if (userHash) {
        emit(SET_USER_HASH_PAIR.REQUEST_KEY, userHash);
      }
    },
    
    getUserHash: () => {
      emit(GET_USER_HASH_PAIR.REQUEST_KEY);
    },
    
    setApiKey: ([apiKey]: SettingActionPayloads['setApiKey']) => {
      if (apiKey) {
        emit(SET_API_KEY_PAIR.REQUEST_KEY, apiKey);
      }
    },
    
    updateLanguageCode: ({ oldCode, newCode }: SettingActionPayloads['updateLanguageCode']) => {
      const value = newCode.toLowerCase();
      languageCodesSignal.value = languageCodesSignal.value.map((temp) => {
        if (temp === oldCode) {
          return value;
        }
        return temp;
      });
    },
    
    addLanguageCode: () => {
      languageCodesSignal.value = [...languageCodesSignal.value, ''];
    },
  };

  return useDispatch(actions);
}