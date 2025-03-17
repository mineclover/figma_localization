import { modalAlert } from '@/components/alert';
import { addLayer } from '@/components/modal/Modal';
import { useFetch } from '@/hooks/useFetch';
import { ComponentChildren, Fragment, h } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { components } from 'types/i18n';
import { onGetDomainSettingResponse, onGetLanguageCodesResponse } from './SettingModel';
import { languageCodesSignal } from '@/model/signal';
import { domainSettingSignal } from '@/model/signal';
import DomainSelect from './DomainSelect';
import { useSignal } from '@/hooks/useSignal';
import {
	Bold,
	Button,
	Container,
	IconButton,
	IconCross32,
	IconPlus32,
	IconSwap32,
	Stack,
	Text,
	Textbox,
	VerticalSpace,
} from '@create-figma-plugin/ui';
import styles from './domainSelect.module.css';
import { GET_PROJECT_ID, SET_LANGUAGE_CODES, SET_PROJECT_ID } from '../constant';
import { emit } from '@create-figma-plugin/utilities';
import { onSetProjectIdResponse } from '../Label/LabelModel';
import { projectIdSignal } from '@/model/signal';
import { clientFetchDBCurry } from '../utils/fetchDB';

const LanguageCode = ({ languageCode }: { languageCode: string }) => {
	return (
		<div className={styles.languageCode}>
			<input
				className={styles.languageCodeInput}
				value={languageCode}
				maxLength={3}
				onChange={(e) => {
					const value = e.currentTarget.value.toLowerCase();
					languageCodesSignal.value = languageCodesSignal.value.map((temp) => {
						if (temp === languageCode) {
							return value;
						}
						return temp;
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

function SettingPage() {
	const { data, loading, hasMessage, setHasMessage, error, fetchData } = useFetch<components['schemas']['Domain'][]>();

	const projectId = useSignal(projectIdSignal);
	const domainSetting = useSignal(domainSettingSignal);

	const languageCodes = useSignal(languageCodesSignal);
	const [domainName, setDomainName] = useState('');

	useEffect(() => {
		if (data && domainSetting) {
			const domain = data.find((domain) => domain.domain_id === domainSetting.domainId);
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
						onClick={() => {
							fetchData('/domains', {
								method: 'GET',
							});
						}}
					>
						<IconSwap32 />
					</IconButton>
				</div>
				{data?.map((domain) => (
					<DomainSelect
						key={domain.domain_id}
						domainId={domain.domain_id}
						domainName={domain.domain_name}
						select={domainSetting?.domainId === domain.domain_id}
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
						onClick={async () => {
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
								fetchData('/domains', {
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
						}}
					>
						<IconPlus32 />
					</IconButton>
				</div>
			</div>
			<VerticalSpace space="extraSmall" />
			<div className={styles.container}>
				<div className={styles.domainContainer}>
					<Bold>Language Codes : {domainSetting?.domainName}</Bold>
					<Button
						onClick={async () => {
							const clientFetch = clientFetchDBCurry(domainSetting?.domainId!);
							console.log('🚀 ~ SettingPage ~ domainSetting:', domainSetting);

							await clientFetch(
								('/domains/' + domainSetting?.domainName + '/languages') as '/domains/{name}/languages',
								{
									method: 'PUT',
									body: JSON.stringify({
										languageCodes: languageCodes.filter((item) => item != ''),
									}),
								}
							);
							fetchData('/domains', {
								method: 'GET',
							});
						}}
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
							<LanguageCode key={index} languageCode={languageCode} />
						))}
					<IconButton
						onClick={() => {
							languageCodesSignal.value = [...languageCodesSignal.value, ''];
						}}
					>
						<IconPlus32 />
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
							// /design/IHkXokQlhcNvBPOFO7h0WY/Untitled?node-id=10-9&m=dev
							const regex = /https:\/\/www\.figma\.com\/design\/([^/]+)\//;
							const match = e.currentTarget.value.match(regex);
							const designId = match ? match[1] : null;
							projectIdSignal.value = 'loading';

							if (designId) {
								emit(SET_PROJECT_ID.REQUEST_KEY, designId);
							} else {
								projectIdSignal.value = '유효하지 않은 값';
							}
						}
					}}
					onBlur={(e) => {
						emit(GET_PROJECT_ID.REQUEST_KEY);
					}}
				/>
			</div>
		</Container>
	);
}
export default SettingPage;
