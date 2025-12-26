import { useEffect, useState } from 'preact/hooks'
import styles from './modal.module.css'
import { type BaseProps, clc, type DiagonalAxis, diagonalAxisToAxis, rectToStyleOffset } from './utils'

type Props = {
  target: HTMLElement
  offset: number
  axis: DiagonalAxis
  children: React.ReactNode
}

const DiagonalClientModal = ({ target, offset, axis, children }: Props & BaseProps['div']) => {
  const direction = diagonalAxisToAxis(axis)

  const [next, setNext] = useState(rectToStyleOffset(target, offset, direction))

  useEffect(() => {
    const handleResize = () => {
      setNext(rectToStyleOffset(target, offset, direction))
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [target, offset, axis])
  return (
    <div style={{ ...next }} className={clc(styles[axis])}>
      {children}
    </div>
  )
}

export default DiagonalClientModal
