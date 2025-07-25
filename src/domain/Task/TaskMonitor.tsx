import { Bold, Button, Divider, IconButton, IconTrash24, Text, VerticalSpace } from '@create-figma-plugin/ui'
import { Fragment, h } from 'preact'
import { useState } from 'preact/hooks'
import { useSignal } from '@/hooks/useSignal'
import { patternMatchDataSignal } from '@/model/signal'
import { MetaData } from '@/domain/Search/searchStore'
import ProgressBar from '@/components/ProgressBar'
import styles from './TaskMonitor.module.css'
import { TaskProcessor, taskProcessorSignal } from './taskProcessor'

export interface TaskItem<T = any> {
	id: string
	name: string
	type: string
	data: T
	status: 'pending' | 'processing' | 'completed' | 'failed'
	progress: number
	error?: string
	startTime?: Date
	endTime?: Date
}

export interface TaskQueue {
	id: string
	name: string
	tasks: TaskItem[]
	currentTaskIndex: number
	status: 'idle' | 'running' | 'paused' | 'completed' | 'failed'
	createdAt: Date
	completedAt?: Date
}

const TaskMonitor = () => {
	const taskProcessor = useSignal(taskProcessorSignal)
	const patternMatchData = useSignal(patternMatchDataSignal)
	const [_selectedQueue, _setSelectedQueue] = useState<string | null>(null)

	const activeQueues = Object.values(taskProcessor.queues).filter(
		queue => queue.status !== 'completed' && queue.status !== 'failed'
	)

	const completedQueues = Object.values(taskProcessor.queues).filter(
		queue => queue.status === 'completed' || queue.status === 'failed'
	)

	const createTaskQueue = () => {
		if (patternMatchData.length === 0) {
			return
		}

		const queueId = `queue_${Date.now()}`
		const tasks: TaskItem<MetaData>[] = patternMatchData.map((data, index) => ({
			id: `task_${queueId}_${index}`,
			name: data.text || data.name || `작업 ${index + 1}`,
			type: 'pattern-match',
			data,
			status: 'pending',
			progress: 0,
		}))

		const queue: TaskQueue = {
			id: queueId,
			name: `패턴 매치 작업 (${tasks.length}개)`,
			tasks,
			currentTaskIndex: 0,
			status: 'idle',
			createdAt: new Date(),
		}

		TaskProcessor.addQueue(queue)
	}

	const startQueue = (queueId: string) => {
		TaskProcessor.startQueue(queueId)
	}

	const pauseQueue = (queueId: string) => {
		TaskProcessor.pauseQueue(queueId)
	}

	const removeQueue = (queueId: string) => {
		TaskProcessor.removeQueue(queueId)
	}

	const getCurrentTask = (queue: TaskQueue): TaskItem | null => {
		return queue.tasks[queue.currentTaskIndex] || null
	}

	const getQueueProgress = (queue: TaskQueue): number => {
		if (queue.tasks.length === 0) {
			return 0
		}
		const completedTasks = queue.tasks.filter(task => task.status === 'completed').length
		return Math.round((completedTasks / queue.tasks.length) * 100)
	}

	const formatDuration = (start: Date, end?: Date): string => {
		const endTime = end || new Date()
		const duration = endTime.getTime() - start.getTime()
		const seconds = Math.floor(duration / 1000)
		const minutes = Math.floor(seconds / 60)
		const hours = Math.floor(minutes / 60)

		if (hours > 0) {
			return `${hours}시간 ${minutes % 60}분`
		}
		if (minutes > 0) {
			return `${minutes}분 ${seconds % 60}초`
		}
		return `${seconds}초`
	}

	return (
		<div className={styles.container}>
			<div className={styles.header}>
				<Bold>작업 모니터링</Bold>
				<Button onClick={createTaskQueue} disabled={patternMatchData.length === 0}>
					새 작업 큐 생성
				</Button>
			</div>

			<Divider />
			<VerticalSpace space="small" />

			{/* 활성 작업 큐 */}
			{activeQueues.length > 0 && (
				<Fragment>
					<Bold>진행 중인 작업</Bold>
					<VerticalSpace space="extraSmall" />
					{activeQueues.map(queue => {
						const currentTask = getCurrentTask(queue)
						const progress = getQueueProgress(queue)

						return (
							<div key={queue.id} className={styles.queueItem}>
								<div className={styles.queueHeader}>
									<Text>{queue.name}</Text>
									<div className={styles.queueActions}>
										{queue.status === 'idle' && (
											<Button onClick={() => startQueue(queue.id)} secondary>
												시작
											</Button>
										)}
										{queue.status === 'running' && (
											<Button onClick={() => pauseQueue(queue.id)} secondary>
												일시정지
											</Button>
										)}
										{queue.status === 'paused' && (
											<Button onClick={() => startQueue(queue.id)} secondary>
												재개
											</Button>
										)}
										<IconButton onClick={() => removeQueue(queue.id)}>
											<IconTrash24 />
										</IconButton>
									</div>
								</div>

								<ProgressBar
									completed={progress}
									height="16px"
									width="100%"
									labelSize="12px"
									customLabel={`${queue.currentTaskIndex + 1} / ${queue.tasks.length}`}
									labelAlignment="center"
									bgColor="var(--figma-color-bg-brand)"
									baseBgColor="var(--figma-color-bg-secondary)"
									labelColor="var(--figma-color-text)"
									margin="4px 0"
								/>

								{currentTask && (
									<div className={styles.currentTask}>
										<Text>현재 작업: {currentTask.name}</Text>
										{currentTask.status === 'processing' && currentTask.progress > 0 && (
											<ProgressBar
												completed={currentTask.progress}
												height="12px"
												width="100%"
												labelSize="10px"
												customLabel={`${currentTask.progress}%`}
												labelAlignment="center"
												bgColor="var(--figma-color-bg-success)"
												baseBgColor="var(--figma-color-bg-secondary)"
												labelColor="var(--figma-color-text-on-brand)"
												margin="2px 0"
											/>
										)}
										{currentTask.status === 'failed' && currentTask.error && (
											<Text className={styles.errorText}>오류: {currentTask.error}</Text>
										)}
									</div>
								)}

								<div className={styles.queueStats}>
									<Text>상태: {queue.status}</Text>
									<Text>소요시간: {formatDuration(queue.createdAt)}</Text>
								</div>
							</div>
						)
					})}
					<VerticalSpace space="medium" />
				</Fragment>
			)}

			{/* 완료된 작업 큐 */}
			{completedQueues.length > 0 && (
				<Fragment>
					<Bold>완료된 작업</Bold>
					<VerticalSpace space="extraSmall" />
					{completedQueues.map(queue => (
						<div key={queue.id} className={styles.queueItem}>
							<div className={styles.queueHeader}>
								<Text>{queue.name}</Text>
								<div className={styles.queueActions}>
									<Text className={queue.status === 'completed' ? styles.successText : styles.errorText}>
										{queue.status === 'completed' ? '완료' : '실패'}
									</Text>
									<IconButton onClick={() => removeQueue(queue.id)}>
										<IconTrash24 />
									</IconButton>
								</div>
							</div>

							<div className={styles.queueStats}>
								<Text>총 작업: {queue.tasks.length}개</Text>
								<Text>성공: {queue.tasks.filter(t => t.status === 'completed').length}개</Text>
								<Text>실패: {queue.tasks.filter(t => t.status === 'failed').length}개</Text>
								{queue.completedAt && <Text>소요시간: {formatDuration(queue.createdAt, queue.completedAt)}</Text>}
							</div>
						</div>
					))}
				</Fragment>
			)}

			{Object.keys(taskProcessor.queues).length === 0 && (
				<div className={styles.emptyState}>
					<Text>생성된 작업 큐가 없습니다.</Text>
					{patternMatchData.length === 0 ? (
						<Text>Keys 탭에서 패턴 매치 데이터를 스캔한 후 작업 큐를 생성하세요.</Text>
					) : (
						<Text>패턴 매치 데이터를 기반으로 새 작업 큐를 생성하세요.</Text>
					)}
				</div>
			)}
		</div>
	)
}

export default TaskMonitor
