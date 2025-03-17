import { signal } from '@preact/signals-core';
import { GET_PROCESS_PAIR } from '../constant';
import { emit, on } from '@create-figma-plugin/utilities';

export type Process = {
	process_id: string;
	process_name: string;
	process_status: number;
	process_end: number;
};

export const processSignal = signal<Record<string, Process>>({});

export const onProcessResponse = () => {
	return on(GET_PROCESS_PAIR.RESPONSE_KEY, (data: Process) => {
		const { process_id } = data;

		processSignal.value = {
			...processSignal.value,
			[process_id]: data,
		};
	});
};

const receiveTimer = {} as Record<
	string,
	{
		data: Process;
		time: number;
	}
>;
const completedTimer = {} as Record<string, NodeJS.Timeout>;

const TICK = 300;

export const processReceiver = (data: Process) => {
	const { process_id, process_status, process_end } = data;

	const now = Date.now();

	const response = () => {
		receiveTimer[process_id] = {
			data,
			time: now,
		};
		emit(GET_PROCESS_PAIR.RESPONSE_KEY, data);
	};

	if (completedTimer[process_id] != null) {
		clearTimeout(completedTimer[process_id]);
	}
	completedTimer[process_id] = setTimeout(() => {
		response();
		delete receiveTimer[process_id];
	}, TICK * 2);

	if (receiveTimer[process_id] == null) {
		response();
	} else if (now - receiveTimer[process_id].time > TICK) {
		response();
	}
};
