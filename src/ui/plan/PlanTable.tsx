import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { useEffect, useState, type FC, useRef } from 'preact/compat'
import type { JSXInternal } from 'preact/src/jsx'
import { ColumnKeys, ColumnKeysMap, Columns, Keys } from 'src/constants'
import { Events, GlobalMediator } from 'src/mediator'
import type { PlanData, PlanDataItem } from 'src/schemas'
import type { Maybe } from 'src/types'
import {
  renderActivityCell,
  renderActLenCell,
  renderCheckboxCell,
  renderLengthCell,
  renderStartCell,
  type CellProps,
} from './cells'
import { usePlan } from './context'
import { DragLayer } from './DragLayer'
import { highlightStyle as highlightingStyle, indexCellStyle } from './styles'
import { TableRow } from './TableRow'
import type { PlanTableColumnDef } from './types'
import { focusCellAtom, highlightingRowIdAtom } from './atoms'
import { useAtom } from 'jotai'
import clsx from 'clsx'
import { TotalHoursLabel } from './lib'
import { parseMins2Time, getNowMins, check } from 'src/util/helper'

export const tableColumns: PlanTableColumnDef[] = [
  {
    header: 'F',
    id: ColumnKeys.F,
    accessorKey: ColumnKeys.F,
    cell: renderCheckboxCell,
  },
  {
    header: 'Start',
    id: ColumnKeys.Start,
    accessorKey: ColumnKeys.Start,
    cell: renderStartCell,
  },
  {
    header: 'Activity',
    id: ColumnKeys.Activity,
    accessorKey: ColumnKeys.Activity,
    cell: renderActivityCell,
  },
  {
    header: 'Length',
    id: ColumnKeys.Length,
    accessorKey: ColumnKeys.Length,
    cell: renderLengthCell,
  },
  {
    header: 'R',
    id: ColumnKeys.R,
    accessorKey: ColumnKeys.R,
    cell: renderCheckboxCell,
  },
  {
    header: 'ActLen',
    id: ColumnKeys.ActLen,
    accessorKey: ColumnKeys.ActLen,
    cell: renderActLenCell,
  },
]

const tableWidthDict: {
  [K in Exclude<ColumnKeys, ColumnKeys.ID>]: `${number}%`
} = {
  [ColumnKeys.F]: '6%',
  [ColumnKeys.Start]: '10%',
  [ColumnKeys.Activity]: '44%',
  [ColumnKeys.Length]: '13%',
  [ColumnKeys.R]: '6%',
  [ColumnKeys.ActLen]: '14%',
}

type PlanTableProps = { data: PlanData; totalMins: number }

export const PlanTable: FC<PlanTableProps> = (props) => {
  const { data } = props
  const { insertRowBelow, updateCell } = usePlan()

  const [focusCell, setFocusCell] = useAtom(focusCellAtom)

  const [highlightingRowId, setHighlightingRowId] = useAtom(highlightingRowIdAtom)

  const table = useReactTable({
    data: data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
  })

  const handleCellFocus = (rowIndex: number, columnKey: ColumnKeys) => {
    setFocusCell({ rowIndex, columnKey })
  }

  const handleCellMouseDown: JSXInternal.MouseEventHandler<HTMLTableCellElement> = (e) => {
    // Disable default behavior for right click
    if (e.button === 2) {
      e.preventDefault()
      return false
    }
  }

  const handleCellKeyDown = async (e: KeyboardEvent, rowIndex: number, columnKey: ColumnKeys) => {
    switch (e.key) {
      case Keys.Enter:
        // Move to next column or create new row
        const column = ColumnKeysMap[columnKey]
        const tableHeight = table.getRowModel().rows.length

        let nextColumn = (column + 1) as Columns
        let nextRowIndex = rowIndex

        const isLastColumn = nextColumn > Columns.R

        if (isLastColumn) {
          nextColumn = Columns.Activity
          nextRowIndex += 1
        }

        const isLastRow = nextRowIndex === tableHeight - 1
        if (isLastColumn && isLastRow) {
          await insertRowBelow(rowIndex)
          setFocusCell({ rowIndex: nextRowIndex, columnKey: ColumnKeysMap[nextColumn] })
          return
        }

        setFocusCell({ rowIndex: nextRowIndex, columnKey: ColumnKeysMap[nextColumn] })

        break

      case Keys.B:
        if (!e.altKey) return
        // Begin or Unfixed Activity
        if (check(data[rowIndex].f)) {
          await updateCell(rowIndex, ColumnKeys.F, '')
        } else {
          await Promise.all([
            updateCell(rowIndex, ColumnKeys.F, 'x'),
            updateCell(rowIndex, ColumnKeys.Start, parseMins2Time(getNowMins())),
          ])
        }
        setFocusCell({ rowIndex, columnKey })
        break

      default:
        break
    }
  }

  const handleBlur: JSXInternal.FocusEventHandler<HTMLElement> = (e) => {
    highlightingRowId && setHighlightingRowId('')

    const relatedTarget = e.relatedTarget as Maybe<HTMLElement>
    const isWithinTable = Boolean(
      relatedTarget && relatedTarget.matchParent('[data-row][data-column]')
    )

    !isWithinTable && setFocusCell(null)
  }

  const tableWrapperRef = useRef<HTMLTableElement>(null)
  const [tableWrapperInfo, setTableWrapperInfo] = useState<{
    offsetY: number
    height: number
    width: number
  }>()

  useEffect(() => {
    if (tableWrapperRef.current) {
      const clientRect = tableWrapperRef.current.getBoundingClientRect()
      setTableWrapperInfo({
        offsetY: clientRect.top,
        height: clientRect.height,
        width: clientRect.width,
      })
    }
  }, [])

  useEffect(() => {
    const mediator = GlobalMediator.getInstance()
    const unsubscribe = mediator.subscribe(Events.JUMP_TO_ACTIVITY, ({ activityId }) => {
      setHighlightingRowId(activityId)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  return (
    <div>
      <div className="relative w-full">
        <DragLayer
          parentOffsetY={tableWrapperInfo?.offsetY ?? 0}
          parentHeight={tableWrapperInfo?.height ?? 0}
          width={tableWrapperInfo?.width ?? 0}
        />
        <table
          ref={tableWrapperRef}
          className="relative w-full table-fixed"
          style={{
            marginBlockEnd: 0,
          }}
        >
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="![&>*:nth-child(2)]:border-l-0">
                <th className={indexCellStyle} width="7%">
                  #
                </th>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.column.id}
                    class={'!px-2 !px-1'}
                    width={
                      tableWidthDict[
                        header.column.columnDef.id as Exclude<ColumnKeys, ColumnKeys.ID>
                      ] as string
                    }
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.original.id} row={row} highlightRow={setHighlightingRowId}>
                {row.getVisibleCells().map((cell) => {
                  const isFocus =
                    highlightingRowId === '' &&
                    focusCell?.rowIndex === row.index &&
                    focusCell?.columnKey === cell.column.id

                  return (
                    <td
                      key={`${cell.column.id}-${row.original[cell.column.id as ColumnKeys]}`}
                      data-row={row.index}
                      data-column={cell.column.id}
                      onMouseDown={handleCellMouseDown}
                      onKeyDown={(e) =>
                        handleCellKeyDown(e, row.index, cell.column.id as ColumnKeys)
                      }
                      onBlur={handleBlur}
                      onFocus={() => handleCellFocus(row.index, cell.column.id as ColumnKeys)}
                      className={clsx(isFocus ? highlightingStyle : '', '!px-2 !px-1')}
                    >
                      {flexRender<CellProps>(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  )
                })}
              </TableRow>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex mt-1 px-2 justify-end">
        <TotalHoursLabel totalMins={props.totalMins} />
      </div>
    </div>
  )
}
