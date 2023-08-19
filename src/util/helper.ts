import type { Table } from '@tgrosinger/md-advanced-tables'
import { type App, TFolder, normalizePath, TFile, Vault, type TAbstractFile } from 'obsidian'
import { getAPI } from 'obsidian-dataview'
import { ActivityDataColumn, INVAlID_NUMBER_LITERAL } from 'src/constants'
import type { Activity, PlanCellType } from 'src/types'
import { TemplaterError } from './error'
import { nanoid } from 'nanoid'

export const removeSpacing = (value: string) => value.replace(/\s+/gm, '')

export const getActivityDataKey = (index: number) => ActivityDataColumn[index] as PlanCellType

export const getActivityDataIndex = (key: PlanCellType) => ActivityDataColumn[key] as number

function tryParse2Int(value?: string) {
  const ret = parseInt(value!)
  return isNaN(ret) ? 0 : ret
}

function paddingZero(value: number) {
  return String(value).padStart(2, '0')
}

export function parseTime2Mins(value: string) {
  const [hoursString, minsString] = value.split(':')

  const hours = tryParse2Int(hoursString) % 24
  const mins = tryParse2Int(minsString) % 60

  return hours * 60 + mins
}

export function parseMins2Time(value: number) {
  const hours = Math.floor(value / 60)
  const mins = value - hours * 60
  return `${paddingZero(hours % 24)}:${paddingZero(mins)}` as const
}

export function getNowMins() {
  const date = new Date()
  const hours = date.getHours()
  const mins = date.getMinutes()
  return hours * 60 + mins
}

export function formatNumberCell(content: number) {
  return Number.isNumber(content)
    ? !Number.isNaN(content)
      ? content.toString()
      : INVAlID_NUMBER_LITERAL
    : content
}

export function check(value: string) {
  return value === 'x' ? true : false
}

export function resolve_tfolder(app: App, folder_str: string): TFolder {
  folder_str = normalizePath(folder_str)

  const folder = app.vault.getAbstractFileByPath(folder_str)
  if (!folder) {
    throw new TemplaterError(`Folder "${folder_str}" doesn't exist`)
  }
  if (!(folder instanceof TFolder)) {
    throw new TemplaterError(`${folder_str} is a file, not a folder`)
  }

  return folder
}

export function get_tfiles_from_folder(app: App, folder_str: string): Array<TFile> {
  const folder = resolve_tfolder(app, folder_str)

  const files: Array<TFile> = []
  Vault.recurseChildren(folder, (file: TAbstractFile) => {
    if (file instanceof TFile) {
      files.push(file)
    }
  })

  files.sort((a, b) => {
    return a.basename.localeCompare(b.basename)
  })

  return files
}

export function transformTable(table: Table): Activity[] {
  const activitiesRows = table
    .getRows()
    .slice(2)
    .map((row) => row.getCells().map((cell) => cell.content))

  const activitiesData: Activity[] = activitiesRows.map((row) =>
    row.reduce(
      (data, v, i) => ({
        ...data,
        [ActivityDataColumn[i]]: v,
      }),
      {} as Activity
    )
  )

  return activitiesData
}

export const checkIsDataviewEnabled = () => !!getAPI()

export function debounceRAFPromise<T extends (...args: unknown[]) => unknown, TArgs extends unknown[] = Parameters<T>, TReturn = ReturnType<T>>(fn: T) {
  let rAFId: number | null = null
  let deferred: {
    promise: Promise<TReturn>
    resolve: (value: unknown) => void
    reject: (reason?: unknown) => void
  } | null = null

  return (...args: TArgs) => {
    const context = this

    if (rAFId) {
      cancelAnimationFrame(rAFId)
    }
    
    if (!deferred) {
      deferred = {
        promise: null as unknown as Promise<TReturn>,
        resolve: null as unknown as (value: unknown) => void,
        reject: null as unknown as (reason?: unknown) => void,
      }
      deferred.promise = new Promise((resolve, reject) => {
        deferred!.resolve = resolve
        deferred!.reject = reject
      })
    }

    rAFId = requestAnimationFrame(() => {
      Promise.resolve(fn.apply(context, args)).then(deferred?.resolve, deferred?.reject)
      deferred = null
    })
    
    return deferred.promise
  }
}

export const shallowCompare = (obj1: Record<any, any>, obj2: Record<any, any>) =>
  Object.keys(obj1).length === Object.keys(obj2).length &&
  Object.keys(obj1).every((key) => obj2.hasOwnProperty(key) && obj1[key] === obj2[key])

export const generateId = () => nanoid(6)
