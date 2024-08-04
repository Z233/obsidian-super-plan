import { find, findLastIndex, isEqual } from 'lodash-es'
import { type App, MarkdownView } from 'obsidian'
import { Scheduler } from 'src/scheduler'
import { Events, GlobalMediator } from 'src/mediator'
import type { Activity, Maybe, PlanTableInfo, ScheduledActivity, UnsafeEditor } from '../types'
import { getNowMins } from '../util/helper'
import type { Parser } from '../parser'
import type { PlanFile } from '../file'
import type { SuperPlanSettings } from '../setting/settings'
import StatusBar from './status-bar/StatusBar.svelte'
import { Timer } from './timer'

type StatusBarProps = StatusBar['$$prop_def']

export interface TrackerState {
  ongoing: Ongoing | null
  upcoming: Upcoming | null
}

interface Ongoing {
  activity: ScheduledActivity
  leftMins: number
  timeoutMins: number
  progress: number
}
interface Upcoming { activity: ScheduledActivity }

export interface Observer {
  update: (state: TrackerState) => void
}

export class PlanTracker {
  private sources: ScheduledActivity[][] = [];
  private observers: Observer[] = []
  private scheduler: Maybe<Scheduler>
  private statusBarComp: StatusBar

  now: Maybe<ScheduledActivity>
  private prev: Maybe<ScheduledActivity>
  private next: Maybe<ScheduledActivity>

  private lastSendNotificationActivity: Maybe<ScheduledActivity>

  addObserver(observer: Observer): void {
    this.observers.push(observer)
  }

  removeObserver(observer: Observer): void {
    const index = this.observers.indexOf(observer)
    if (index !== -1)
      this.observers.splice(index, 1)
  }

  notifyObservers(params: Parameters<Observer['update']>[0]): void {
    this.observers.forEach(observer => observer.update(params))
  }

  constructor(
    private app: App,
    private parser: Parser,
    private file: PlanFile,
    private settings: SuperPlanSettings,
    private statusBar: HTMLElement,
  ) {}

  init() {
    this.statusBarComp = new StatusBar({
      target: this.statusBar,
      props: {
        now: this.now,
        next: this.next,
        progressType: this.settings.progressType,
        jump2ActivityRow: this.jump2ActivityRow.bind(this),
        beginActivity: this.beginActivity.bind(this),
      },
    })

    this.settings.onUpdate((options) => {
      if (options.progressType) {
        this.statusBarComp.$set({
          progressType: options.progressType,
        })
      }
    })

    const timer = Timer.new()
    timer.onTick(this.onTick.bind(this))
  }

  private updateStatusBar(props: StatusBarProps) {
    this.statusBarComp.$set(props)
  }

  private async beginActivity() {
    throw new Error('Method not implemented.')
  }
  
  private getCurrentActivity() {
    const nowMins = getNowMins();

    const curActs = this.sources.at(
      this.sources.findIndex(
        (acts) => nowMins >= acts[0].start && nowMins <= acts[acts.length - 1].stop
      )
    )!
      
    const curActIdx = findLastIndex(curActs, (a) => nowMins >= a.start && a.isFixed)
    const curIsLast = curActIdx === curActs.length - 1

    const curAct = curIsLast ? null : curActs.at(curActIdx)!
    const nextAct = curIsLast ? null : find(curActs, a => a.actLen >= 0, curActIdx + 1)
    
    return [curAct, nextAct] as const
  }
  
  private async jump2ActivityRow(activity: ScheduledActivity) {
    const { workspace } = this.app

    const file = this.file.todayFile

    if (!file)
      return

    const activeView = workspace.getActiveViewOfType(MarkdownView)
    const shouldOpenFile = !(activeView && file && activeView.file === file)

    if (shouldOpenFile) {
      const leaf = workspace.getLeaf()
      await leaf.openFile(file, { active: true })
    }

    const editor = workspace.activeEditor!.editor! as UnsafeEditor
    editor.focus()

    GlobalMediator.getInstance().send(Events.JUMP_TO_ACTIVITY, { activityId: activity.id })

    // setImmediate(() => {
    //   editor.scrollIntoView(
    //     {
    //       from: {
    //         line: targetLine,
    //         ch: CURSOR_CH_AFTER_FOCUS,
    //       },
    //       to: {
    //         line: targetLine,
    //         ch: CURSOR_CH_AFTER_FOCUS,
    //       },
    //     },
    //     true
    //   )
    // })
  }

  private computeProgress() {
    const initialState = {
      now: null,
      next: null,
      progress: 0,
      leftSecs: 0,
      leftMins: 0,
      timeoutMins: 0,
    }

    if (!this.sources) return initialState
    
    const [curAct, nextAct] = this.getCurrentActivity()
    
    if (!curAct) return initialState

    const nowMins = getNowMins()

    const durationMins = nowMins - curAct.start
    const durationSecs = durationMins * 60 + new Date().getSeconds()
    const totalMins = curAct.actLen
    const totalSecs = totalMins * 60
    const progress = totalMins > 0 ? (durationSecs / totalSecs) * 100 : 100

    return {
      ...initialState,
      now: curAct,
      next: nextAct,
      progress,
      leftSecs: totalSecs - durationSecs,
      leftMins: totalMins - durationMins,
      timeoutMins: durationMins - totalMins,
    }
  }

  private async onTick() {
    const { leftMins, timeoutMins, ...props } = this.computeProgress()

    this.updateStatusBar(props)
    const { now, next, progress } = props

    if (!isEqual(now, this.now)) {
      this.prev = this.now
      this.now = now
    }

    const ongoing: Maybe<Ongoing> = now
      ? {
          activity: now,
          leftMins,
          timeoutMins,
          progress,
        }
      : null

    const upcoming: Maybe<Upcoming> = next
      ? {
          activity: next,
        }
      : null

    this.notifyObservers({ ongoing, upcoming })

    // ================== Notification ==================

    if (this.settings.enableNotification) {
      const nowMins = getNowMins()
      const nowMinsSecs = new Date().getSeconds()

      // a fixed activity will begin
      const isNextWillStart = Boolean(
        next
          && next.isFixed
          && nowMinsSecs === 59
          && nowMins + 1 >= next.start - this.settings.minsLeftToSendNotification,
      )
      const isNowWillStop = Boolean(
        this.now && nowMins >= this.now.stop - this.settings.minsLeftToSendNotification,
      )

      // check this.prev: prevent sending a notification at the start
      if (
        ((this.prev && isNowWillStop) || isNextWillStart)
        && this.lastSendNotificationActivity !== this.now
      ) {
        const content = isNextWillStart
          ? `A fixed activity will start soon, time to move on.`
          : `It's time to begin the next activity!`
        // eslint-disable-next-line no-new
        new Notification(content)
        this.lastSendNotificationActivity = this.now

        // TODO: Jump to next activity row
        // notification.addEventListener("click", () => {});
      }
    }
  }

  setData(rawSources: Maybe<Activity[][]>) {
    if (rawSources) {
      const scheduler = new Scheduler(rawSources.flat())
      const actCounts = rawSources.map((acts) => acts.length)
      this.sources = scheduler.activities.reduce((acc, cur, idx)=> {
        const groupIdx = acc.length - 1;
        const prevGroupCount = groupIdx > 0 ? acc[groupIdx - 1].length : 0
        if (idx + 1 - prevGroupCount > actCounts[groupIdx]) {
          acc[groupIdx + 1] = [cur]
        } else {
          acc[groupIdx].push(cur)
        }
        return acc
      }, [[]] as ScheduledActivity[][])
    }
    this.updateStatusBar(this.computeProgress())
  }
}
