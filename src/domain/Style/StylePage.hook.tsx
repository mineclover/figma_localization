import { useEffect, useState } from 'preact/hooks';
import { ActionType } from '../System/ActionResourceDTO';
import { StyleSync } from '@/model/types';

type Props = {
	key: string;
	xmlString: string;
	action: ActionType;
};

const fetchMap = (action: ActionType) => {
	switch (action) {
		case 'default':
			return action;
	}
};

const useStylePageHook = ({ key, xmlString, action }: Props) => {
	const [dataLoading, setDataLoading] = useState(true);

	useEffect(() => {
		setDataLoading(false);
	}, []);

	return {
		dataLoading,
	};
};

export default useStylePageHook;
