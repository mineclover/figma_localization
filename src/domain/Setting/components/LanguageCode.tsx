import { h } from 'preact';
import { languageCodesSignal } from '@/model/signal';
import { Dispatch } from '@/hooks/useDispatch';
import styles from '../domainSelect.module.css';

type LanguageCodeProps = {
  languageCode: string;
  dispatch: Dispatch;
};

export const LanguageCode = ({ languageCode, dispatch }: LanguageCodeProps) => {
  return (
    <div className={styles.languageCode}>
      <input
        className={styles.languageCodeInput}
        value={languageCode}
        maxLength={3}
        onChange={(e) => {
          dispatch({
            type: 'updateLanguageCode',
            payload: { oldCode: languageCode, newCode: e.currentTarget.value }
          });
        }}
        onBlur={(e) => {
          const value = e.currentTarget.value.toLowerCase();
          languageCodesSignal.value = languageCodesSignal.value
            .filter((item) => item != '')
            .map((temp) => {
              if (temp === languageCode) {
                return value;
              }
              return temp;
            });
        }}
      />
    </div>
  );
};