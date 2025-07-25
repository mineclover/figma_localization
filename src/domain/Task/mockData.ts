import { PatternMatchData } from '@/model/types'
import { TaskItem, TaskQueue } from './TaskMonitor'

// 목 PatternMatchData 데이터 (PatternMatchData = Omit<SearchNodeData, 'id'> & { ids: string[] })
export const mockPatternMatchData: PatternMatchData[] = [
	{
		name: 'Login Button',
		text: '로그인',
		localizationKey: 'login.button',
		parentName: 'LoginForm',
		ignore: false,
		ids: ['node_1', 'node_2', 'node_3'],
	},
	{
		name: 'Cancel Button',
		text: '취소',
		localizationKey: '',
		parentName: 'Modal',
		ignore: false,
		ids: ['node_4', 'node_5'],
	},
	{
		name: 'Welcome Message',
		text: '환영합니다',
		localizationKey: 'welcome.message',
		parentName: 'Header',
		ignore: false,
		ids: ['node_6'],
	},
	{
		name: 'Error Text',
		text: '오류가 발생했습니다',
		localizationKey: '',
		parentName: 'ErrorDialog',
		ignore: true,
		ids: ['node_7', 'node_8'],
	},
	{
		name: 'Submit Button',
		text: '제출',
		localizationKey: 'form.submit',
		parentName: 'ContactForm',
		ignore: false,
		ids: ['node_9'],
	},
	{
		name: 'Loading Text',
		text: '로딩 중...',
		localizationKey: 'loading.text',
		parentName: 'LoadingSpinner',
		ignore: false,
		ids: ['node_10', 'node_11', 'node_12', 'node_13'],
	},
	{
		name: 'Save Button',
		text: '저장',
		localizationKey: 'common.save',
		parentName: 'Toolbar',
		ignore: false,
		ids: ['node_14', 'node_15'],
	},
	{
		name: 'Delete Confirmation',
		text: '정말 삭제하시겠습니까?',
		localizationKey: 'confirm.delete',
		parentName: 'ConfirmDialog',
		ignore: false,
		ids: ['node_16'],
	},
]

// 목 TaskQueue 데이터 생성 함수
export const createMockTaskQueue = (id: string, name: string, status: TaskQueue['status']): TaskQueue => {
	const now = new Date()
	const tasks: TaskItem[] = mockPatternMatchData.slice(0, Math.floor(Math.random() * 4) + 2).map((data, index) => ({
		id: `task_${id}_${index}`,
		name: data.text || data.name,
		data,
		status: getRandomTaskStatus(status, index),
		progress: getRandomProgress(status, index),
		startTime: status !== 'idle' ? new Date(now.getTime() - Math.random() * 60000) : undefined,
		endTime:
			status === 'completed' || status === 'failed' ? new Date(now.getTime() - Math.random() * 30000) : undefined,
		error: status === 'failed' && Math.random() > 0.7 ? '도메인 설정이 없습니다.' : undefined,
	}))

	return {
		id,
		name,
		tasks,
		currentTaskIndex: getCurrentTaskIndex(status, tasks.length),
		status,
		createdAt: new Date(now.getTime() - Math.random() * 3600000), // 1시간 내 랜덤
		completedAt:
			status === 'completed' || status === 'failed' ? new Date(now.getTime() - Math.random() * 1800000) : undefined,
	}
}

// 상태에 따른 랜덤 태스크 상태 생성
function getRandomTaskStatus(queueStatus: TaskQueue['status'], index: number): TaskItem['status'] {
	if (queueStatus === 'idle') {
		return 'pending'
	}
	if (queueStatus === 'running') {
		if (index === 0) {
			return Math.random() > 0.5 ? 'processing' : 'completed'
		}
		if (index === 1) {
			return Math.random() > 0.3 ? 'pending' : 'processing'
		}
		return 'pending'
	}
	if (queueStatus === 'completed') {
		return 'completed'
	}
	if (queueStatus === 'failed') {
		const rand = Math.random()
		if (rand > 0.8) {
			return 'failed'
		}
		if (rand > 0.5) {
			return 'completed'
		}
		return 'pending'
	}
	return 'pending'
}

// 상태에 따른 랜덤 진행률 생성
function getRandomProgress(queueStatus: TaskQueue['status'], index: number): number {
	if (queueStatus === 'idle') {
		return 0
	}
	if (queueStatus === 'running') {
		if (index === 0) {
			return Math.floor(Math.random() * 100)
		}
		return 0
	}
	if (queueStatus === 'completed') {
		return 100
	}
	if (queueStatus === 'failed') {
		return Math.floor(Math.random() * 80)
	}
	return 0
}

// 상태에 따른 현재 작업 인덱스 생성
function getCurrentTaskIndex(status: TaskQueue['status'], taskLength: number): number {
	if (status === 'idle') {
		return 0
	}
	if (status === 'running') {
		return Math.floor(Math.random() * Math.min(2, taskLength))
	}
	if (status === 'completed') {
		return taskLength
	}
	if (status === 'failed') {
		return Math.floor(Math.random() * taskLength)
	}
	return 0
}

// 목 TaskQueue 데이터들
export const mockTaskQueues: Record<string, TaskQueue> = {
	queue_active_1: createMockTaskQueue('queue_active_1', '로그인 페이지 로컬라이제이션 (5개)', 'running'),
	queue_active_2: createMockTaskQueue('queue_active_2', '메인 페이지 버튼 텍스트 (3개)', 'paused'),
	queue_completed_1: createMockTaskQueue('queue_completed_1', '에러 메시지 처리 (4개)', 'completed'),
	queue_failed_1: createMockTaskQueue('queue_failed_1', '폼 검증 텍스트 (6개)', 'failed'),
	queue_idle_1: createMockTaskQueue('queue_idle_1', '네비게이션 메뉴 (2개)', 'idle'),
}

// 목 데이터 토글 함수 (기본값을 true로 설정하여 데모용으로 활성화)
let useMockData = true

export const toggleMockData = () => {
	useMockData = !useMockData
	return useMockData
}

export const isMockDataEnabled = () => useMockData

// 목 데이터를 실제 signal에 적용하는 함수
export const applyMockData = () => {
	const { patternMatchDataSignal } = require('@/model/signal')
	const { taskProcessorSignal } = require('./taskProcessor')

	// patternMatchData에 목 데이터 적용
	patternMatchDataSignal.value = mockPatternMatchData

	// taskProcessor에 목 큐 데이터 적용
	taskProcessorSignal.value = {
		queues: mockTaskQueues,
		isProcessing: mockTaskQueues.queue_active_1.status === 'running',
		currentQueueId: mockTaskQueues.queue_active_1.status === 'running' ? 'queue_active_1' : null,
	}
}

// 목 데이터 초기화 함수
export const clearMockData = () => {
	const { patternMatchDataSignal } = require('@/model/signal')
	const { taskProcessorSignal } = require('./taskProcessor')

	patternMatchDataSignal.value = []
	taskProcessorSignal.value = {
		queues: {},
		isProcessing: false,
		currentQueueId: null,
	}
}
