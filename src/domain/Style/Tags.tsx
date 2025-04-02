import { h } from 'preact';
import { ActionType } from '../System/ActionResourceDTO';
import useFp from '@/hooks/useFp';
import { parseXmlToFlatStructure } from '@/utils/xml2';
import { XmlFlatNode } from '@/utils/types';
import { useEffect, useState } from 'preact/hooks';
import { LocalizationKeyAction } from '@/model/types';
import { Dropdown, DropdownOption } from '@create-figma-plugin/ui';
import { StatusByCode } from '../System/identifier';
import { TargetedEvent } from 'preact/compat';
import styles from './StylePage.module.css';
import { signal } from '@preact/signals-core';
import { useSignal } from '@/hooks/useSignal';
import { clientFetchDBCurry } from '../utils/fetchDB';

type Props = {
	localizationKey: string;
	xmlString: string;
	action: ActionType;
};

const xmlParse = async (xmlString: string) => {
	const flatItems = await parseXmlToFlatStructure(xmlString);
	return flatItems;
};

const targetKeyParse = async (flatItems: XmlFlatNode[]) => {
	const targetKey = flatItems.filter((item) => item.tagName !== 'br');

	return new Set(targetKey.map((item) => item.tagName));
};

// userId 필요하긴 한데 일단 넣지 않음
const serverCurry = (key: string, action: ActionType) => {
	return async function serverKeyParse(
		this: {
			fn1: Awaited<ReturnType<typeof xmlParse>>;
			fn2: Awaited<ReturnType<typeof targetKeyParse>>;
		},
		list: Set<string>
	) {
		console.log(this);

		const fetchClient = clientFetchDBCurry('1');
		const result = await fetchClient(
			['/localization/actions?key_id=', key, '&action=', action].join('') as '/localization/actions',
			{
				method: 'GET',
			}
		);

		console.log('🚀 ~ serverCurry ~ result:', result);
		const data = (await result.json()) as LocalizationKeyAction[];
		console.log('🚀 ~ serverCurry ~ data:', data);

		const keyMap: Record<string, string> = {};

		for (const item of list) {
			if (item !== '') {
				keyMap[item] = '';
			}
		}
		const output = data.reduce((acc, item, index) => {
			console.log('🚀 ~ output ~ index:', index);

			const effectKey = item.effect_resource_id;
			const styleKey = item.style_resource_id;
			const normalKey = [effectKey, styleKey].join(':');
			acc[normalKey] = item.from_enum;
			return acc;
		}, keyMap);

		return output;
	};
};

/** 선택된 대상은 제거 */
const divideItemsBySelection = (list: string[], selected: string[]) => {
	return list.filter((item) => !selected.includes(item));
};

/** 값이 "" 인 애들은 제거 */
const extractSelectedItems = (object: Record<string, string>) => {
	const selectObject = Object.entries(object).filter(([key, value]) => value !== '');
	return Object.fromEntries(selectObject);
};

export const tagsSignal = signal<Record<string, string>>({});
export const setTags = (list: Record<string, string>) => {
	tagsSignal.value = list;
};

const TagsSort = ({ list }: { list: Record<string, string> }) => {
	console.log('🚀 ~ TagsSort ~ list:', list);
	const tags = useSignal<Record<string, string>>(tagsSignal);
	// const [tags, setTags] = useState<Record<string, string>>({});
	console.log('🚀 ~ TagsSort ~ tags:', tags);

	useEffect(() => {
		setTags(list);
	}, [list]);

	const handleChange = (targetKey: string) => (event: TargetedEvent<HTMLInputElement, Event>) => {
		const next = event.currentTarget.value;

		const nextObject = { ...tags };

		if (next !== '') {
			for (const [key, value] of Object.entries(tags)) {
				if (value === next) {
					nextObject[key] = '';
				}
			}
		}

		setTags({
			...nextObject,
			[targetKey]: event.currentTarget.value,
		});
	};
	const value = Object.entries(tags);
	const items = extractSelectedItems(tags);
	const selected = Object.values(items);
	const divideItems = divideItemsBySelection(Object.keys(StatusByCode), selected);
	const selectedOptions: Array<DropdownOption> = selected
		.sort()
		.reverse()
		.map((key) => ({
			value: key,
		}));
	const divideOptions: Array<DropdownOption> = divideItems
		.sort()
		.reverse()
		.map((key) => ({
			value: key,
		}));

	const options: Array<DropdownOption> = [...divideOptions, { header: 'selected' }, ...selectedOptions];

	return (
		<div className={styles.table}>
			{value.map(([key, value]) => {
				return (
					<label className={styles.row}>
						<span className={styles.label}>{key}</span>
						<Dropdown onChange={handleChange(key)} options={[{ value: '' }, ...options]} value={value} />
					</label>
				);
			})}
		</div>
	);
};

// 이전에 진행 된 것 : 인식 > 리소스 등록 > 텍스트 추출 > xml 전달 > 인터페이스 표시
// 이후 : xml 파싱 > 타겟 키 추출 > 서버 키 추출 > 서버 키와 현재 키 비교
// 겹칠 경우 대체 , 겹치지 않을 경우 인터페이스에 표시
//
const Tags = ({ localizationKey, xmlString, action }: Props) => {
	console.log(`🚀 ~ Tags ~ { key, xmlString, action }:`, { localizationKey, xmlString, action });
	const { state, results, reset, allFulfilled } = useFp(xmlString, {
		fn1: xmlParse,
		fn2: targetKeyParse,
		fn3: serverCurry(localizationKey, action),
	});
	console.log('🚀 ~ Tags ~ results:', results);

	useEffect(() => {
		reset();
	}, [localizationKey, action]);

	const value = allFulfilled ? (results['fn3'] ?? {}) : {};
	console.log('🚀 ~ Tags ~ value:', value);

	if (!allFulfilled) return <div>Loading...</div>;
	return <TagsSort key={allFulfilled} list={value} />;
};

export default Tags;
