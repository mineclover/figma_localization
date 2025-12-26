const ListIcon = ({ size = 24, color = '#5F6368', ...props }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M3 16V14H10V16H3ZM3 12V10H14V12H3ZM3 8V6H14V8H3ZM16 20V16H12V14H16V10H18V14H22V16H18V20H16Z"
        fill={color}
      />
    </svg>
  )
}

export default ListIcon
