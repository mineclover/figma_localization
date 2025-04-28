import { LocationDTO } from '@/model/types';
import { emit, on } from '@create-figma-plugin/utilities';
import { SEARCH_STORE_LOCATION_EMIT } from '../constant';
import { MetaData, searchStore } from './searchStore';
import { searchStoreLocationSignal } from '@/model/signal';

/**
 * 클라이언트용 데이터 셋
 * this.baseLocationStore = new Map<string, LocationDTO>(); 를 받는 클라이언트
 * postClientLocation 에서 호출
 **/
export const onClientLocation = () => {
	// client 로 데이터 보내기
	return on(SEARCH_STORE_LOCATION_EMIT.RESPONSE_KEY, (nodeInfo: [string, LocationDTO][]) => {
		searchStoreLocationSignal.value = new Map(nodeInfo);
	});
};
