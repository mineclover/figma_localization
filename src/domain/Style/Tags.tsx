import { h } from 'preact';
import { ActionType } from '../System/ActionResourceDTO';
import useFp from '@/hooks/useFp';
import { parseXmlToFlatStructure } from '@/utils/xml2';
import { XmlFlatNode } from '@/utils/types';
import { useEffect } from 'preact/hooks';
import { LocalizationKeyAction } from '@/model/types';

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

		const result = await fetch(
			['http://localhost:6543/localization/actions?key_id=', key, '&action=', action].join(''),
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

const TagsSort = async (list: Record<string, string>) => {
	console.log('🚀 ~ sort ~ s:', list);
	return '';
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

	useEffect(() => {
		reset();
	}, [localizationKey, action]);

	const value = allFulfilled ? (results['fn3'] ?? {}) : {};

	return (
		<div>
			{Object.entries(value).map(([key, value]) => {
				return (
					<div>
						{key} : {value}
					</div>
				);
			})}
		</div>
	);
};

export default Tags;
