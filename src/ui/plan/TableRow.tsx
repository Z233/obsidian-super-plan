import { useEffect, useState, type FC } from 'preact/compat'
import type { Row } from '@tanstack/react-table'
import type { PlanDataItem } from 'src/schemas'
import clsx from 'clsx'
import { dropOverStyle, focusStyle, indexCellStyle } from './styles'
import { getIcon, Menu } from 'obsidian'
import { usePlanContext } from './context'
import { useDrag, useDrop } from 'react-dnd'
import { Icon } from './lib'
import { getEmptyImage } from 'react-dnd-html5-backend'

export const TableRow: FC<{ row: Row<PlanDataItem> }> = (props) => {
  const { row } = props
  const { deleteRow, insertRowBelow, moveRow } = usePlanContext()

  const [highlighted, setHighlighted] = useState(false)
  const [isHover, setIsHover] = useState(false)

  const [{ isDragging }, dragRef, dragPreview] = useDrag({
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    item: () => row,
    type: 'ROW',
  })

  const [{ isOver }, dropRef] = useDrop({
    accept: 'ROW',
    drop: (draggedRow: Row<PlanDataItem>) => {
      const from = draggedRow.index
      const to = row.index
      from > to ? moveRow(from, to + 1) : moveRow(from, to)
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  })

  useEffect(() => {
    dragPreview(getEmptyImage(), { captureDraggingState: true })
  }, [])

  const handlePlusClick = (rowIndex: number) => {
    insertRowBelow(rowIndex)
  }

  const handleContextMenu = (e: MouseEvent, rowIndex: number) => {
    e.preventDefault()

    setHighlighted(true)

    const menu = new Menu()

    menu.addItem((item) =>
      item
        .setTitle('Delete')
        .setIcon('trash')
        .onClick(() => {
          deleteRow(rowIndex)
        })
    )

    menu.onHide(() => {
      setHighlighted(false)
    })

    menu.showAtMouseEvent(e)

    return false
  }

  return (
    <tr
      ref={dropRef}
      key={row.id}
      className={clsx({
        '![&>*:nth-child(2)]:border-l-0 relative': true,
        [focusStyle]: highlighted,
        [dropOverStyle]: true,
        '!after:visible': isOver,
      })}
      onContextMenu={(e) => handleContextMenu(e, row.index)}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
    >
      <td className={indexCellStyle}>
        {(() =>
          isHover ? (
            <div className="relative">
              <span
                ref={dragRef}
                className="cursor-grab absolute -left-4 top-1/2 -translate-y-1/2 "
              >
                <Icon svg={getIcon('grip-vertical')!} className="hover:text-$interactive-accent" />
              </span>
              <Icon
                onClick={() => handlePlusClick(row.index)}
                svg={getIcon('plus')!}
                className="hover:text-$interactive-accent"
              />
            </div>
          ) : (
            <div className="w-6">{row.index + 1}</div>
          ))()}
      </td>

      {props.children}
    </tr>
  )
}
