import { h } from 'preact'
// import { useUser } from './userProvider'

import { userAtom } from './userModel'
import { useSignal } from '@/hooks/useSignal'
import { useEffect, useState } from 'preact/hooks'
import { dataEmit, DuplexDataHandler } from '../interface'
import { emit } from '@create-figma-plugin/utilities'

function UserPage() {
	const user = useSignal(userAtom)
	const [name, setName] = useState(user.name)
	const [uuid, setUuid] = useState(user.uuid)

	useEffect(() => {
		setName(user.name)
		setUuid(user.uuid)
	}, [user])

	return (
		<div>
			<h1>user</h1>
			<span>{name}</span>
			<span>{uuid}</span>
			<br />
			<input type="text" value={name} onChange={(e) => setName(e.currentTarget.value)} />
			<input type="text" value={uuid} onChange={(e) => setUuid(e.currentTarget.value)} />
			<button
				onClick={() =>
					emit<DuplexDataHandler<'user'>>('DATA_user', {
						uuid: uuid,
						name: name,
					})
				}
			>
				전송
			</button>
		</div>
	)
}

export default UserPage
