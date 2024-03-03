import { type FC, useCallback, useEffect, useState } from 'preact/compat'
import type { Row } from '@tanstack/react-table'
import type { PlanDataItem } from 'src/schemas'
import clsx from 'clsx'
import { getIcon } from 'obsidian'
import { useDrag, useDrop } from 'react-dnd'
import { getEmptyImage } from 'react-dnd-html5-backend'
import { ACTIVITY_TR_ID_PREFIX, ColumnKeys } from 'src/constants'
import { check, getNowMins, parseMins2Time } from 'src/util/helper'
import { useAtom } from 'jotai'
import { SplitConfirmModalV2 } from '../modals'
import { PlanMenu, type PlanMenuItem } from './menu'
import { Icon } from './lib'
import { usePlan, usePlanAtoms } from './context'
import { dropOverStyle, highlightStyle, indexCellStyle } from './styles'

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
  highlightRow: (activityId: string) => void
}> = (props) => {
  const { row, highlightRow } = props
  const activityId = row.original.id
  const { insertRowBelow, moveRow } = usePlan()
  const { highlightingRowIdAtom } = usePlanAtoms()
  const [highlightingRowId] = useAtom(highlightingRowIdAtom)

  const [isHover, setIsHover] = useState(false)

  const [, dragRef, dragPreview] = useDrag({
    collect: monitor => ({
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
    collect: monitor => ({
      isOver: monitor.isOver(),
    }),
  })

  useEffect(() => {
    dragPreview(getEmptyImage(), { captureDraggingState: true })
  }, [])

  const { focusCellAtom } = usePlanAtoms()
  const [, setFocusCell] = useAtom(focusCellAtom)

  const handlePlusClick = (rowIndex: number) => {
    insertRowBelow(rowIndex).then(() => {
      setFocusCell({ rowIndex: rowIndex + 1, columnKey: ColumnKeys.Activity })
    })
  }

  const { handleBegin, handleSplit, handleIgnore, handleDelete } = useTableRowActions(row)

  const menuItems: PlanMenuItem[] = [
    {
      title: 'Begin',
      icon: 'play',
      callback: check(row.original.f) ? undefined : handleBegin,
    },
    // {
    //   title: 'Cancel',
    //   icon: 'x',
    //   callback: check(row.original.f) ? handleCancel : undefined,
    // },
    {
      title: 'Ignore',
      icon: 'ban',
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
  ].filter(item => item.callback !== undefined)

  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault()

    highlightRow(activityId)

    const menu = new PlanMenu(menuItems)

    menu.onHide(() => {
      highlightRow('')
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
        [highlightStyle]: highlightingRowId === row.original.id,
        [dropOverStyle]: true,
        '!after:visible': isOver,
      })}
      onContextMenu={e => handleContextMenu(e)}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
    >
      <td className={indexCellStyle}>
        {(() =>
          isHover
            ? (
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
              )
            : (
            <div className="w-6">{row.index + 1}</div>
              ))()}
      </td>

      {props.children}
    </tr>
  )
}
