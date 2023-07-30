import { useEffect, useState, useCallback, type FC, type StateUpdater } from 'preact/compat'
import type { Row } from '@tanstack/react-table'
import type { PlanDataItem } from 'src/schemas'
import clsx from 'clsx'
import { dropOverStyle, focusStyle, indexCellStyle } from './styles'
import { getIcon } from 'obsidian'
import { usePlan } from './context'
import { useDrag, useDrop } from 'react-dnd'
import { Icon } from './lib'
import { getEmptyImage } from 'react-dnd-html5-backend'
import { PlanMenu, type PlanMenuItem } from './menu'
import type { Maybe } from 'src/types'
import { ACTIVITY_TR_ID_PREFIX, ColumnKeys } from 'src/constants'
import { check, getNowMins, parseMins2Time } from 'src/util/helper'
import { SplitConfirmModalV2 } from '../modals'
import type { CellPosition } from './types'

function useTableRowActions(row: Row<PlanDataItem>) {
  const { deleteRow, updateCell, duplicateRow } = usePlan()

  const handleBegin = useCallback(() => {
    updateCell(row.index, ColumnKeys.F, 'x')
    updateCell(row.index, ColumnKeys.Start, parseMins2Time(getNowMins()))
  }, [row])

  const handleCancel = useCallback(() => {
    updateCell(row.index, ColumnKeys.F, '')
    updateCell(row.index, ColumnKeys.Start, '')
  }, [row])

  const handleSplit = useCallback(async () => {
    const activity = row.original
    const modal = new SplitConfirmModalV2(app, activity)
    const result = await modal.open()
    if (result.ok && result.data) {
      const { firstLength, secondLength } = result.data
      duplicateRow(row.index)
      updateCell(row.index, ColumnKeys.Length, firstLength.toString())
      updateCell(row.index + 1, ColumnKeys.Length, secondLength.toString())
    }
  }, [row])

  const handleIgnore = useCallback(() => {
    updateCell(row.index, ColumnKeys.F, '')
    updateCell(row.index, ColumnKeys.Length, '0')
    updateCell(row.index, ColumnKeys.R, '')
  }, [row])

  const handleDelete = useCallback(() => {
    deleteRow(row.index)
  }, [row])

  return {
    handleBegin,
    handleCancel,
    handleSplit,
    handleIgnore,
    handleDelete,
  }
}

export const TableRow: FC<{
  row: Row<PlanDataItem>
  setHighlightedCell: StateUpdater<Maybe<CellPosition>>
  highlighted: boolean
  highlightRow: (activityId: string) => void
}> = (props) => {
  const { row, setHighlightedCell, highlighted, highlightRow } = props
  const activityId = row.original.id
  const { insertRowBelow, moveRow } = usePlan()

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
      setHighlightedCell({ rowIndex: rowIndex + 1, columnKey: ColumnKeys.Activity })
    })
  }

  const { handleBegin, handleCancel, handleSplit, handleIgnore, handleDelete } =
    useTableRowActions(row)

  const menuItems: PlanMenuItem[] = [
    {
      title: 'Begin',
      icon: 'play',
      callback: check(row.original.f) ? undefined : handleBegin,
    },
    {
      title: 'Cancel',
      icon: 'x',
      callback: check(row.original.f) ? handleCancel : undefined,
    },
    {
      title: 'Ignore',
      icon: 'slash',
      callback: handleIgnore,
    },
    {
      title: 'Split',
      icon: 'divide',
      callback: handleSplit,
    },
    {
      title: 'Delete',
      icon: 'trash',
      callback: handleDelete,
    },
  ].filter((item) => item.callback !== undefined)

  const handleContextMenu = (e: MouseEvent, rowIndex: number) => {
    e.preventDefault()

    highlightRow(activityId)

    const menu = new PlanMenu(menuItems)

    menu.onHide(() => {
      highlightRow(activityId)
    })

    menu.showAtMouseEvent(e)

    return false
  }

  return (
    <tr
      ref={dropRef}
      id={`${ACTIVITY_TR_ID_PREFIX}${row.original.id}`}
      key={row.original.id}
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
