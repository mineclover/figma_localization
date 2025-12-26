import { useState } from 'preact/hooks'
import styles from './LogsPage.module.css'

type Props = {}

// 로그 항목의 타입 정의
type LogItem = {
  is_creation: boolean
  version_id: number
  localization_id: number
  key_id: number
  key_name: string
  language_code: string
  domain_id: number
  domain_name: string
  version: number
  text: string
  user_id: number
  modified_by_username: string
  created_at: string
}

// 로그 데이터의 타입 정의
type LogsData = {
  total: number
  logs: LogItem[]
}

// 테스트용 더미 데이터
const dummyData = {
  total: 51,
  logs: [
    {
      is_creation: false,
      version_id: 51,
      localization_id: 1,
      key_id: 1,
      key_name: 'Default_header_renamed',
      language_code: 'origin',
      domain_id: 2,
      domain_name: 'test',
      version: 5,
      text: 'ヘッダー Updated',
      user_id: 1,
      modified_by_username: 'admin',
      created_at: '2025-03-14 01:35:10',
    },
    // 추가 더미 데이터 (테스트용)
    ...Array(15)
      .fill(0)
      .map((_, i) => ({
        is_creation: i % 3 === 0,
        version_id: 50 - i,
        localization_id: i + 1,
        key_id: i + 1,
        key_name: `Key_${i + 1}`,
        language_code: i % 2 === 0 ? 'ko' : 'en',
        domain_id: (i % 4) + 1,
        domain_name: `domain_${(i % 4) + 1}`,
        version: Math.floor(Math.random() * 10) + 1,
        text: `텍스트 예제 ${i + 1}`,
        user_id: (i % 3) + 1,
        modified_by_username: `user_${(i % 3) + 1}`,
        created_at: `2025-03-${14 - (i % 14)} ${i % 24}:${i % 60}:${i % 60}`,
      })),
  ],
}

const LogsPage = (_props: Props) => {
  // 페이지네이션 상태 관리
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // 데이터 소스 (실제 구현에서는 API 호출로 대체될 수 있음)
  const data: LogsData = dummyData

  // 전체 페이지 수 계산
  const totalPages = Math.ceil(data.total / itemsPerPage)

  // 현재 페이지의 데이터 계산
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, data.logs.length)
  const currentLogs = data.logs.slice(startIndex, endIndex)

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // 페이지네이션 버튼 생성
  const renderPaginationButtons = () => {
    const buttons = []

    // 이전 페이지 버튼
    buttons.push(
      <button
        key="prev"
        className={styles.pageButton}
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        이전
      </button>,
    )

    // 페이지 번호 버튼들
    const maxButtons = 5 // 표시할 최대 버튼 수
    const startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2))
    const endPage = Math.min(totalPages, startPage + maxButtons - 1)

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button key={i} className={styles.pageButton} onClick={() => handlePageChange(i)} disabled={currentPage === i}>
          {i}
        </button>,
      )
    }

    // 다음 페이지 버튼
    buttons.push(
      <button
        key="next"
        className={styles.pageButton}
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        다음
      </button>,
    )

    return buttons
  }

  return (
    <div>
      <h1>로그</h1>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>ID</th>
            <th>키 이름</th>
            <th>도메인</th>
            <th>언어</th>
            <th>텍스트</th>
            <th>생성/수정</th>
            <th>수정자</th>
            <th>날짜</th>
          </tr>
        </thead>
        <tbody>
          {currentLogs.map((log) => (
            <tr key={log.version_id}>
              <td>{log.version_id}</td>
              <td>{log.key_name}</td>
              <td>{log.domain_name}</td>
              <td>{log.language_code}</td>
              <td>{log.text}</td>
              <td>{log.is_creation ? '생성' : '수정'}</td>
              <td>{log.modified_by_username}</td>
              <td>{log.created_at}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className={styles.pagination}>{renderPaginationButtons()}</div>

      <div>
        총 {data.total}개의 로그, {currentPage} / {totalPages} 페이지
      </div>
    </div>
  )
}

export default LogsPage
