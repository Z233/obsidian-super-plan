import { useEffect, useState, type FC, type StateUpdater } from 'preact/compat'
import type { Row } from '@tanstack/react-table'
import type { PlanDataItem } from 'src/schemas'
import clsx from 'clsx'
import { dropOverStyle, focusStyle, indexCellStyle } from './styles'
import { getIcon, Menu } from 'obsidian'
import { usePlan, usePlanContext } from './context'
import { useDrag, useDrop } from 'react-dnd'
import { Icon } from './lib'
import { getEmptyImage } from 'react-dnd-html5-backend'
import { PlanMenu } from './menu'
import type { Maybe } from 'src/types'
import type { Position } from './PlanTable'
import { ColumnKeys } from 'src/constants'
import { check, getNowMins, parseMins2Time } from 'src/util/helper'
import { SplitConfirmModalV2 } from '../modals'

export const TableRow: FC<{
  row: Row<PlanDataItem>
  setFocusedPosition: StateUpdater<Maybe<Position>>
  highlighted: boolean
  highlightRow: (activityId: string) => void
}> = (props) => {
  const { row, setFocusedPosition, highlighted, highlightRow } = props
  const activityId = row.original.id

  const { app } = usePlanContext()
  const { deleteRow, insertRowBelow, moveRow, updateCell, duplicateRow } = usePlan()

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

  const handleBegin = () => {
    updateCell(row.index, ColumnKeys.F, 'x')
    updateCell(row.index, ColumnKeys.Start, parseMins2Time(getNowMins()))
  }

  const handleCancel = () => {
    updateCell(row.index, ColumnKeys.F, '')
    updateCell(row.index, ColumnKeys.Start, '')
  }

  const handleSplit = async () => {
    const activity = row.original
    const modal = new SplitConfirmModalV2(app, activity)
    const result = await modal.open()
    if (result.ok && result.data) {
      const { firstLength, secondLength } = result.data
      duplicateRow(row.index)
      updateCell(row.index, ColumnKeys.Length, firstLength.toString())
      updateCell(row.index + 1, ColumnKeys.Length, secondLength.toString())
    }
  }

  const handleContextMenu = (e: MouseEvent, rowIndex: number) => {
    e.preventDefault()

    highlightRow(activityId)

    const menu = new PlanMenu({
      onBegin: check(row.original.f) ? undefined : handleBegin,
      onCancel: check(row.original.f) ? handleCancel : undefined,
      onSplit: handleSplit,
      onDeleteRow: () => deleteRow(rowIndex),
    })

    menu.onHide(() => {
      highlightRow(activityId)
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
