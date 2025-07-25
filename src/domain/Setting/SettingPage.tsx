import { modalAlert } from '@/components/alert';
import { addLayer } from '@/components/modal/Modal';
import { useFetch } from '@/hooks/useFetch';
import { ComponentChildren, Fragment, h } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { components } from 'types/i18n';
import {
  onGetDomainSettingResponse,
  onGetLanguageCodesResponse,
} from './SettingModel';
import {
  apiKeySignal,
  languageCodesSignal,
  userHashSignal,
} from '@/model/signal';
import { domainSettingSignal } from '@/model/signal';
import DomainSelect from './DomainSelect';
import { useSignal } from '@/hooks/useSignal';
import { useSettingActions } from './useSettingActions';
import { LanguageCode } from './components/LanguageCode';
import {
  Bold,
  Button,
  Container,
  IconButton,
  IconCloseSmall24,
  IconPlusSmall24,
  IconSwapSmall24,
  Stack,
  Text,
  Textbox,
  VerticalSpace,
} from '@create-figma-plugin/ui';
import styles from './domainSelect.module.css';
import {
  GET_PROJECT_ID,
  GET_USER_HASH_PAIR,
  SET_API_KEY_PAIR,
  SET_LANGUAGE_CODES,
  SET_PROJECT_ID,
  SET_USER_HASH_PAIR,
} from '../constant';
import { emit } from '@create-figma-plugin/utilities';
import { onSetProjectIdResponse } from '../Label/LabelModel';
import { projectIdSignal } from '@/model/signal';
import { clientFetchDBCurry } from '../utils/fetchDB';

function SettingPage() {
  const { data, loading, hasMessage, setHasMessage, error, fetchData } =
    useFetch<components['schemas']['Domain'][]>();

  const projectId = useSignal(projectIdSignal);
  const domainSetting = useSignal(domainSettingSignal);
  const apiKey = useSignal(apiKeySignal);
  const userHash = useSignal(userHashSignal);
  const languageCodes = useSignal(languageCodesSignal);
  const [domainName, setDomainName] = useState('');
  const { dispatch, actions } = useSettingActions();

  useEffect(() => {
    if (data && domainSetting) {
      const domain = data.find(
        (domain) => domain.domain_id === domainSetting.domainId
      );
      if (domain) {
        languageCodesSignal.value = domain.language_codes;
        emit(SET_LANGUAGE_CODES.REQUEST_KEY, domain.language_codes);
      }
    }
  }, [data, domainSetting]);

  useEffect(() => {
    fetchData('/domains', {
      method: 'GET',
    });
  }, []);

  return (
    <Container space="extraSmall">
      <VerticalSpace space="extraSmall" />
      <div className={styles.container}>
        <div className={styles.domainContainer}>
          <Bold>Domain</Bold>
          <IconButton
            onClick={() => dispatch(actions.refreshDomains([fetchData as any]))}
          >
            <IconSwapSmall24 />
          </IconButton>
        </div>
        {data?.map((domain) => (
          <DomainSelect
            key={domain.domain_id}
            domainId={domain.domain_id}
            domainName={domain.domain_name}
            // 숫자가 넘어오기 때문에
            select={domainSetting?.domainId == domain.domain_id}
          />
        ))}
        <div className={styles.buttonContainer}>
          <Text className={styles.nowrap}>새 도메인 추가 : </Text>
          <Textbox
            placeholder="도메인 이름"
            value={domainName}
            onChange={(e) => setDomainName(e.currentTarget.value)}
          />
          <IconButton
            onClick={() =>
              dispatch(
                actions.addDomain([domainName, domainSetting, fetchData as any])
              )
            }
          >
            <IconPlusSmall24 />
          </IconButton>
        </div>
      </div>
      <VerticalSpace space="extraSmall" />
      <div className={styles.container}>
        <div className={styles.domainContainer}>
          <Bold>Language Codes : {domainSetting?.domainName}</Bold>
          <Button
            onClick={() =>
              dispatch(
                actions.updateLanguageCodes([
                  languageCodes,
                  domainSetting,
                  fetchData as any,
                ])
              )
            }
          >
            SAVE
          </Button>
        </div>
        <div className={styles.languageCodesContainer}>
          {languageCodes
            .filter((item, index, arr) => {
              return arr.indexOf(item) === index;
            })
            .map((languageCode, index) => (
              <LanguageCode
                key={index}
                languageCode={languageCode}
                dispatch={dispatch}
              />
            ))}
          <IconButton onClick={() => dispatch(actions.addLanguageCode())}>
            <IconPlusSmall24 />
          </IconButton>
        </div>
      </div>
      <VerticalSpace space="extraSmall" />
      <div className={styles.container}>
        <div className={styles.domainContainer}>
          <Bold>Project ID</Bold>
        </div>
        <Text>Section URL을 복사하여 입력 후 Enter (최초 1회)</Text>
        <Textbox
          placeholder={'project Id'}
          value={projectId}
          onKeyUp={(e) => {
            if (e.key === 'Enter') {
              dispatch(actions.setProjectId([e.currentTarget.value]));
            }
          }}
          onBlur={() => dispatch(actions.getProjectId())}
        />
      </div>

      <VerticalSpace space="extraSmall" />
      <div className={styles.container}>
        <div className={styles.domainContainer}>
          <Bold>User Hash</Bold>
        </div>
        <Text>식별 키 (CMS에서 받을 수 있을지도)</Text>
        <Textbox
          placeholder={'user hash'}
          value={userHash ?? ''}
          onChange={(e) => {
            userHashSignal.value = e.currentTarget.value;
          }}
          onKeyUp={(e) => {
            if (e.key === 'Enter') {
              dispatch(actions.setUserHash([e.currentTarget.value]));
            }
          }}
          onBlur={() => dispatch(actions.getUserHash())}
        />
      </div>
      <VerticalSpace space="extraSmall" />
      <div className={styles.container}>
        <div className={styles.domainContainer}>
          <Bold>API Key</Bold>
        </div>
        <Text>Google Ai Studio API Key</Text>

        <Textbox
          placeholder={'api key'}
          value={apiKey ?? ''}
          onChange={(e) => {
            apiKeySignal.value = e.currentTarget.value;
          }}
          onKeyUp={(e) => {
            if (e.key === 'Enter') {
              dispatch(actions.setApiKey([e.currentTarget.value]));
            }
          }}
          onBlur={() => dispatch(actions.getUserHash())}
        />
      </div>
    </Container>
  );
}
export default SettingPage;
