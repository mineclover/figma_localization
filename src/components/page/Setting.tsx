import { ComponentChildren, Fragment, h } from 'preact'
import { useState } from 'preact/hooks'

import { useSignal } from '@/hooks/useSignal'
import CategoryModal from '@/domain/category/CategoryModal'
import SectionPage from '@/domain/section/SectionPage'

const Setting = () => {
	return (
		<div>
			{/* 현재 섹션 alias 추가 */}
			<SectionPage />
			<CategoryModal.AddModal />
		</div>
	)
}

export default Setting
