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
import { Bold, Button, Container, Stack, Text, Textbox, VerticalSpace } from '@create-figma-plugin/ui';
import styles from './domainSelect.module.css';
import { GET_PROJECT_ID, SET_LANGUAGE_CODES, SET_PROJECT_ID } from '../constant';
import { emit } from '@create-figma-plugin/utilities';
import { onSetProjectIdResponse } from '../Label/LabelModel';
import { projectIdSignal } from '@/model/signal';

function SettingPage() {
	const { data, loading, error, fetchData } = useFetch<components['schemas']['Domain'][]>();

	const projectId = useSignal(projectIdSignal);

	const domainSetting = useSignal(domainSettingSignal);
	const languageCodes = useSignal(languageCodesSignal);

	useEffect(() => {
		if (data && domainSetting) {
			const domain = data.find((domain) => domain.domain_id === domainSetting.domainId);
			if (domain) {
				languageCodesSignal.value = domain.language_codes;
				emit(SET_LANGUAGE_CODES.REQUEST_KEY, domain.language_codes);
			}
		}
	}, [domainSetting]);

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
					<Button
						onClick={() => {
							fetchData('/domains', {
								method: 'GET',
							});
						}}
					>
						update
					</Button>
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
					<Bold>Language Codes</Bold>
				</div>
				<div className={styles.languageCodesContainer}>
					{languageCodes.map((languageCode, index) => {
						if (index === 0) {
							return <span key={index}>{languageCode}</span>;
						}
						return (
							<Fragment key={index}>
								<span>/</span>
								<span>{languageCode}</span>
							</Fragment>
						);
					})}
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
