import { Combobox } from '@headlessui/react'
import clsx from 'clsx'
import type { Result, Success } from 'obsidian-dataview'
import { getAPI } from 'obsidian-dataview'
import { type FC, Fragment, createPortal, useState } from 'preact/compat'
import useSWR from 'swr'
import { normalizePath } from 'obsidian'
import { usePlanContext } from './context'

interface Segment {
  left: string
  middle: string
  right: string
  fullText: string
}

function divide(text: string, keyword: string): Segment | null {
  const re = new RegExp(`(^.*?)(${keyword})(.*)`, 'i')
  const match = text.match(re)
  if (!match)
    return null

  const [, left, middle, right] = match

  return {
    left,
    middle,
    right,
    fullText: text,
  }
}

function checkIsQuerySuccess(query: Result<unknown, unknown>): query is Success<unknown, unknown> {
  return query.successful
}

function useActivitiesQuery(keyword: string) {
  if (keyword.trim().length === 0)
    return []

  const { settings } = usePlanContext()

  const { data } = useSWR(
    ['ACTIVITIES', keyword],
    async () => {
      const dv = getAPI()
      if (!dv)
        return []

      const query = await dv.query(
        `LIST A.activity FROM "${normalizePath(settings.dailyPlanNoteFolder)}"
        FLATTEN file.plans AS P
        FLATTEN P.activities AS A
        WHERE icontains(A.activity, "${keyword}")`,
      )

      if (!checkIsQuerySuccess(query))
        return []

      const activities: string[] = query.value.values.map(x => x.value).filter(x => x)
      const uniqueActivities = [...new Set(activities)]

      return uniqueActivities.map(act => divide(act, keyword)).filter(x => !!x) as Segment[]
    },
    {
      fallbackData: [],
    },
  )

  return data
}

export const ActivitySuggesterPopup: FC<{
  anchor: HTMLElement
  keyword: string
}> = (props) => {
  const { anchor, keyword } = props
  const [{ top, left, width }] = useState(() => anchor.getBoundingClientRect())

  const segments = useActivitiesQuery(keyword)

  if (segments.length === 0)
    return null

  return createPortal(
    <div
      className="suggestion-container fixed"
      style={{
        top: `calc(var(--line-height-tight) * var(--font-ui-medium) + var(--size-2-2) + ${top}px)`,
        left,
        width,
      }}
    >
      <Combobox.Options as={Fragment}>
        <div className="suggestion">
          {segments.map(segment => (
            <Combobox.Option as={Fragment} key={segment.fullText} value={segment.fullText}>
              {({ active }: { selected: boolean; active: boolean }) => (
                <div className={clsx('suggestion-item', active && 'is-selected')}>
                  <span>{segment.left}</span>
                  <span class="u-pop">{segment.middle}</span>
                  <span>{segment.right}</span>
                </div>
              )}
            </Combobox.Option>
          ))}
        </div>
      </Combobox.Options>
    </div>,
    document.body,
  )
}
