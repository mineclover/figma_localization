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
			/>
		</div>
	);
};

function SettingPage() {
	const { data, loading, error, fetchData } = useFetch<components['schemas']['Domain'][]>();

	const projectId = useSignal(projectIdSignal);

	const domainSetting = useSignal(domainSettingSignal);
	console.log('🚀 ~ SettingPage ~ domainSetting:', domainSetting);
	const languageCodes = useSignal(languageCodesSignal);

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
										languageCodes: languageCodes,
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
				<Text>현재 페이지의 Section URL을 복사하여 입력해주세요. (최초 1회)</Text>
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
