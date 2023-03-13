import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table'
import { Menu, Notice } from 'obsidian'
import { useEffect, useState, type FC, createElement } from 'preact/compat'
import type { JSXInternal } from 'preact/src/jsx'
import { ColumnKeys } from 'src/constants'
import type { PlanData, PlanDataItem } from 'src/schemas'
import type { Maybe } from 'src/types'
import {
  renderActivityCell,
  renderActLenCell,
  renderCheckboxCell,
  renderLengthCell,
  renderStartCell,
} from './cells'
import { usePlanContext } from './context'
import { PlusIcon } from './lib'
import { focusStyle, indexCellStyle } from './styles'
import clsx from 'clsx'

export type PlanTableColumnDef = ColumnDef<PlanDataItem>

export const tableColumns: PlanTableColumnDef[] = [
  {
    header: 'F',
    accessorKey: ColumnKeys.F,
    cell: renderCheckboxCell,
  },
  {
    header: 'Start',
    accessorKey: ColumnKeys.Start,
    cell: renderStartCell,
  },
  {
    header: 'Activity',
    accessorKey: ColumnKeys.Activity,
    cell: renderActivityCell,
  },
  {
    header: 'Length',
    accessorKey: ColumnKeys.Length,
    cell: renderLengthCell,
  },
  {
    header: 'R',
    accessorKey: ColumnKeys.R,
    cell: renderCheckboxCell,
  },
  {
    header: 'ActLen',
    accessorKey: ColumnKeys.ActLen,
    cell: renderActLenCell,
  },
]

export type FocusPosition = {
  rowIndex: number
  columnKey: ColumnKeys
}

export const PlanTable: FC<{ initialData: PlanData }> = (props) => {
  const { initialData } = props
  const { deleteRow, insertRowBelow, setFocus, getFocus } = usePlanContext()

  const [focusedPosition, setFocusedPosition] = useState<Maybe<FocusPosition>>()
  const [highlightedRow, setHighlightedRow] = useState(-1)

  const saveFocus = (focusPosition: Maybe<FocusPosition>) => {
    if (focusPosition) {
      setFocus(focusPosition)
      setFocusedPosition(focusPosition)
    } else {
      setFocus(null)
      setFocusedPosition(null)
    }
  }

  const table = useReactTable({
    data: initialData,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
  })

  const handleCellFocus = (rowIndex: number, columnKey: ColumnKeys) => {
    saveFocus({ rowIndex, columnKey })
  }

  const handleCellMouseDown: JSXInternal.MouseEventHandler<HTMLTableCellElement> = (e) => {
    // Disable default behavior for right click
    if (e.button === 2) {
      e.preventDefault()
      return false
    }
  }

  const handlePlusClick = (rowIndex: number) => {
    insertRowBelow(rowIndex)
  }

  const handleBlur: JSXInternal.FocusEventHandler<HTMLElement> = (e) => {
    const relatedTarget = e.relatedTarget

    if (relatedTarget) {
      const path = (e as any).path as HTMLElement[]
      const startIndex = path.indexOf(relatedTarget as HTMLElement)

      let isWithinTable = false

      for (let i = startIndex; i < path.length; i++) {
        const el = path[i]
        if (el && el.dataset?.row && el.dataset?.column) {
          isWithinTable = true
          break
        }
      }

      !isWithinTable && saveFocus(null)
    }
  }

  useEffect(() => {
    const focus = getFocus()
    if (focus) {
      setFocusedPosition(focus)
    }
  }, [])

  const [hoverRowIndex, setHoverRowIndex] = useState<number>(-1)

  const handleMouseEnter = (rowIndex: number) => {
    setHoverRowIndex(rowIndex)
  }

  const handleMouseLeave = (rowIndex: number) => {
    setHoverRowIndex(-1)
  }

  const handleContextMenu = (e: MouseEvent, rowIndex: number) => {
    e.preventDefault()

    setHighlightedRow(rowIndex)

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
      setHighlightedRow(-1)
    })

    menu.showAtMouseEvent(e)

    return false
  }

  return (
    <table onBlur={handleBlur}>
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id} className="![&>*:nth-child(2)]:border-l-0">
            <th className={indexCellStyle}>#</th>
            {headerGroup.headers.map((header) => (
              <th key={header.column.id}>
                {flexRender(header.column.columnDef.header, header.getContext())}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr
            key={row.id}
            className={clsx({
              '![&>*:nth-child(2)]:border-l-0': true,
              [focusStyle]: row.index === highlightedRow,
            })}
            onContextMenu={(e) => handleContextMenu(e, row.index)}
            onMouseEnter={() => handleMouseEnter(row.index)}
            onMouseLeave={() => handleMouseLeave(row.index)}
          >
            <td className={indexCellStyle}>
              {(() =>
                hoverRowIndex === row.index ? (
                  <div>
                    <PlusIcon
                      onClick={() => handlePlusClick(row.index)}
                      className="hover:text-$interactive-accent"
                    />
                  </div>
                ) : (
                  <div className="w-6">{row.index + 1}</div>
                ))()}
            </td>

            {row.getVisibleCells().map((cell) => {
              const isFocused =
                highlightedRow < 0 &&
                focusedPosition?.rowIndex === row.index &&
                focusedPosition?.columnKey === cell.column.id

              return (
                <td
                  data-row={row.index}
                  data-column={cell.column.id}
                  onMouseDown={handleCellMouseDown}
                  onFocus={() => handleCellFocus(row.index, cell.column.id as ColumnKeys)}
                  className={isFocused ? focusStyle : ''}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
