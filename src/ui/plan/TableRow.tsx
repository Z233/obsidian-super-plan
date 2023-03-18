import { useEffect, useState, type FC, type StateUpdater } from 'preact/compat'
import type { Row } from '@tanstack/react-table'
import type { PlanDataItem } from 'src/schemas'
import clsx from 'clsx'
import { dropOverStyle, focusStyle, indexCellStyle } from './styles'
import { getIcon, Menu } from 'obsidian'
import { usePlan } from './context'
import { useDrag, useDrop } from 'react-dnd'
import { Icon } from './lib'
import { getEmptyImage } from 'react-dnd-html5-backend'
import { PlanMenu } from './menu'
import type { Maybe } from 'src/types'
import type { Position } from './PlanTable'
import { ColumnKeys } from 'src/constants'
import { getNowMins, parseMins2Time } from 'src/util/helper'

export const TableRow: FC<{
  row: Row<PlanDataItem>
  setFocusedPosition: StateUpdater<Maybe<Position>>
}> = (props) => {
  const { row, setFocusedPosition } = props
  const { deleteRow, insertRowBelow, moveRow, updateCell } = usePlan()

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
    Promise.resolve().then(() => {
      setFocusedPosition({ rowIndex: rowIndex + 1, columnKey: ColumnKeys.Activity })
    })
  }

  const handleContextMenu = (e: MouseEvent, rowIndex: number) => {
    e.preventDefault()

    setHighlighted(true)

    const menu = new PlanMenu({
      onBegin: () => {
        updateCell(rowIndex, ColumnKeys.F, 'x')
        updateCell(rowIndex, ColumnKeys.Start, parseMins2Time(getNowMins()))
      },
      onDeleteRow: () => deleteRow(rowIndex),
    })

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
