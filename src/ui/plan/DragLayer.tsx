import type { FC } from 'preact/compat'
import { useDragLayer } from 'react-dnd'

const LAYER_HEIGHT = 28

export const DragLayer: FC<{
  parentOffsetY: number
  parentHeight: number
  width: number
}> = (props) => {
  const { parentOffsetY, parentHeight, width } = props
  const { isDragging, item, initialOffset, currentOffset, clientOffset } = useDragLayer(
    (monitor) => ({
      item: monitor.getItem(),
      initialOffset: monitor.getInitialSourceClientOffset(),
      currentOffset: monitor.getSourceClientOffset(),
      isDragging: monitor.isDragging(),
      clientOffset: monitor.getClientOffset(),
    })
  )

  if (!isDragging) {
    return null
  }

  const { x, y: currentY } = currentOffset!

  let y = currentY - parentOffsetY
  y = y < 0 ? 0 : y
  y = y > parentHeight - LAYER_HEIGHT ? parentHeight - LAYER_HEIGHT : y

  return (
    <div
      className="h-8 bg-black absolute z-20 opacity-5 pointer-events-none"
      style={{ top: `${y}px`, width: `${width}px` }}
    ></div>
  )
}
