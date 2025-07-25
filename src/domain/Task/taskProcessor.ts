import { emit } from '@create-figma-plugin/utilities'
import { signal } from '@preact/signals-core'
import { notify } from '@/figmaPluginUtils'
import { domainSettingSignal } from '@/model/signal'
import { PatternMatchData } from '@/model/types'
import { baseIsAllNode } from '../Batch/batchModel'
import { GET_PATTERN_MATCH_KEY } from '../constant'
import { TaskItem, TaskQueue } from './TaskMonitor'

interface TaskProcessorState {
	queues: Record<string, TaskQueue>
	isProcessing: boolean
	currentQueueId: string | null
}

export const taskProcessorSignal = signal<TaskProcessorState>({
	queues: {},
	isProcessing: false,
	currentQueueId: null,
})

// 모듈 레벨 변수들
let intervalId: number | null = null
const PROCESSING_DELAY = 1000 // 1초 간격으로 작업 처리

// 내부 함수들
const startProcessing = () => {
	if (intervalId) {
		return
	}

	intervalId = window.setInterval(() => {
		processNextTask()
	}, PROCESSING_DELAY)
}

const stopProcessing = () => {
	if (intervalId) {
		clearInterval(intervalId)
		intervalId = null
	}
}

const processNextTask = async () => {
	const state = taskProcessorSignal.value
	const { currentQueueId } = state

	if (!currentQueueId || !state.isProcessing) {
		stopProcessing()
		return
	}

	const queue = state.queues[currentQueueId]
	if (!queue || queue.status !== 'running') {
		stopProcessing()
		return
	}

	const currentTask = queue.tasks[queue.currentTaskIndex]
	if (!currentTask) {
		// 모든 작업 완료
		completeQueue(currentQueueId)
		return
	}

	if (currentTask.status === 'pending') {
		await executeTask(currentQueueId, currentTask)
	} else if (currentTask.status === 'completed' || currentTask.status === 'failed') {
		// 다음 작업으로 이동
		moveToNextTask(currentQueueId)
	}
}

const executeTask = async (queueId: string, task: TaskItem) => {
	const state = taskProcessorSignal.value
	const _queue = state.queues[queueId]

	// 작업 시작
	const updatedTask = {
		...task,
		status: 'processing' as const,
		startTime: new Date(),
		progress: 0,
	}

	updateTask(queueId, updatedTask)

	try {
		// 실제 작업 수행 - patternMatchData를 기반으로 로컬라이제이션 작업 수행
		await performLocalizationTask(updatedTask, (progress: number) => {
			updateTaskProgress(queueId, task.id, progress)
		})

		// 작업 완료
		const completedTask = {
			...updatedTask,
			status: 'completed' as const,
			progress: 100,
			endTime: new Date(),
		}

		updateTask(queueId, completedTask)
		notify(`작업 완료: ${task.name}`, 'success')
	} catch (error) {
		// 작업 실패
		const failedTask = {
			...updatedTask,
			status: 'failed' as const,
			error: error instanceof Error ? error.message : '알 수 없는 오류',
			endTime: new Date(),
		}

		updateTask(queueId, failedTask)
		notify(`작업 실패: ${task.name} - ${failedTask.error}`, 'error')
	}
}

const performLocalizationTask = async (task: TaskItem, onProgress: (progress: number) => void): Promise<void> => {
	const { data } = task

	onProgress(20)

	// 로컬라이제이션 키 설정 작업 수행
	if (data.ids && data.ids.length > 0) {
		// 현재 도메인 설정 가져오기
		const domainSetting = domainSettingSignal.value
		if (!domainSetting?.domainId) {
			throw new Error('도메인 설정이 없습니다.')
		}

		// 기존 batchModel의 baseIsAllNode 함수 활용
		const localizationData = {
			domainId: domainSetting.domainId,
			keyId: data.localizationKey || `auto_key_${Date.now()}`,
			ids: data.ids,
		}

		onProgress(50)

		// 첫 번째 노드를 기준 노드로 설정
		const baseNodeId = data.ids[0]

		await baseIsAllNode(localizationData, baseNodeId)

		onProgress(100)
	} else {
		throw new Error('작업할 노드 ID가 없습니다.')
	}
}

const updateTask = (queueId: string, updatedTask: TaskItem) => {
	const state = taskProcessorSignal.value
	const queue = state.queues[queueId]

	if (!queue) {
		return
	}

	const updatedTasks = queue.tasks.map(task => (task.id === updatedTask.id ? updatedTask : task))

	const updatedQueue = { ...queue, tasks: updatedTasks }

	taskProcessorSignal.value = {
		...state,
		queues: {
			...state.queues,
			[queueId]: updatedQueue,
		},
	}
}

const updateTaskProgress = (queueId: string, taskId: string, progress: number) => {
	const state = taskProcessorSignal.value
	const queue = state.queues[queueId]

	if (!queue) {
		return
	}

	const updatedTasks = queue.tasks.map(task => (task.id === taskId ? { ...task, progress } : task))

	const updatedQueue = { ...queue, tasks: updatedTasks }

	taskProcessorSignal.value = {
		...state,
		queues: {
			...state.queues,
			[queueId]: updatedQueue,
		},
	}
}

const moveToNextTask = (queueId: string) => {
	const state = taskProcessorSignal.value
	const queue = state.queues[queueId]

	if (!queue) {
		return
	}

	const nextIndex = queue.currentTaskIndex + 1

	if (nextIndex >= queue.tasks.length) {
		// 모든 작업 완료
		completeQueue(queueId)
		return
	}

	const updatedQueue = { ...queue, currentTaskIndex: nextIndex }

	taskProcessorSignal.value = {
		...state,
		queues: {
			...state.queues,
			[queueId]: updatedQueue,
		},
	}
}

const completeQueue = (queueId: string) => {
	const state = taskProcessorSignal.value
	const queue = state.queues[queueId]

	if (!queue) {
		return
	}

	const failedTasks = queue.tasks.filter(task => task.status === 'failed')
	const finalStatus = failedTasks.length > 0 ? 'failed' : 'completed'

	const updatedQueue = {
		...queue,
		status: finalStatus as const,
		completedAt: new Date(),
	}

	taskProcessorSignal.value = {
		...state,
		queues: {
			...state.queues,
			[queueId]: updatedQueue,
		},
		isProcessing: false,
		currentQueueId: null,
	}

	stopProcessing()

	const message =
		finalStatus === 'completed'
			? `모든 작업이 완료되었습니다: ${queue.name}`
			: `작업이 완료되었으나 일부 실패했습니다: ${queue.name} (실패: ${failedTasks.length}개)`

	notify(message, finalStatus === 'completed' ? 'success' : 'warning')

	// 다른 대기 중인 큐가 있는지 확인하고 자동 시작
	checkForNextQueue()
}

const checkForNextQueue = () => {
	const state = taskProcessorSignal.value
	const waitingQueues = Object.values(state.queues).filter(queue => queue.status === 'idle')

	if (waitingQueues.length > 0) {
		const nextQueue = waitingQueues[0]
		setTimeout(() => {
			TaskProcessor.startQueue(nextQueue.id)
		}, 1000) // 1초 후 다음 큐 시작
	}
}

// 공개 API
export const TaskProcessor = {
	addQueue(queue: TaskQueue) {
		const state = taskProcessorSignal.value
		taskProcessorSignal.value = {
			...state,
			queues: {
				...state.queues,
				[queue.id]: queue,
			},
		}
	},

	removeQueue(queueId: string) {
		const state = taskProcessorSignal.value
		const { [queueId]: removed, ...remainingQueues } = state.queues

		taskProcessorSignal.value = {
			...state,
			queues: remainingQueues,
			currentQueueId: state.currentQueueId === queueId ? null : state.currentQueueId,
		}

		if (state.currentQueueId === queueId) {
			stopProcessing()
		}
	},

	startQueue(queueId: string) {
		const state = taskProcessorSignal.value
		const queue = state.queues[queueId]

		if (!queue) {
			return
		}

		// 큐 상태를 실행 중으로 변경
		const updatedQueue = { ...queue, status: 'running' as const }
		taskProcessorSignal.value = {
			...state,
			queues: {
				...state.queues,
				[queueId]: updatedQueue,
			},
			currentQueueId: queueId,
			isProcessing: true,
		}

		startProcessing()
		notify(`작업 큐 "${queue.name}" 시작됨`, 'success')
	},

	pauseQueue(queueId: string) {
		const state = taskProcessorSignal.value
		const queue = state.queues[queueId]

		if (!queue) {
			return
		}

		const updatedQueue = { ...queue, status: 'paused' as const }
		taskProcessorSignal.value = {
			...state,
			queues: {
				...state.queues,
				[queueId]: updatedQueue,
			},
			isProcessing: false,
			currentQueueId: null,
		}

		stopProcessing()
		notify(`작업 큐 "${queue.name}" 일시정지됨`, 'warning')
	},

	// 패턴 매치 데이터 요청 메서드
	async requestPatternMatchData(targetID?: string): Promise<void> {
		// 기존 batchModel의 onPatternMatchResponse 로직 활용
		emit(GET_PATTERN_MATCH_KEY.REQUEST_KEY, targetID)
	},
}
