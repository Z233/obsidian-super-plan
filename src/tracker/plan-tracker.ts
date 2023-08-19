import type { ScheduledActivity, Maybe, PlanTableInfo, UnsafeEditor, Activity } from '../types'
import { getNowMins } from '../util/helper'
import type { Parser } from '../parser'
import type { PlanFile } from '../file'
import type { SuperPlanSettings } from '../setting/settings'
import { find, findLastIndex, isEqual } from 'lodash-es'
import { MarkdownView, type App } from 'obsidian'
import StatusBar from './status-bar/StatusBar.svelte'
import { Scheduler } from 'src/scheduler'
import { Timer } from './timer'
import { Events, GlobalMediator } from 'src/mediator'

type StatusBarProps = StatusBar['$$prop_def']

export type TrackerState = {
  ongoing: Ongoing | null
  upcoming: Upcoming | null
}

type Ongoing = { activity: ScheduledActivity; leftSecs: number; progress: number }
type Upcoming = { activity: ScheduledActivity }

export type Observer = {
  update: (state: TrackerState) => void
}

export class PlanTracker {
  private observers: Observer[] = []

  private scheduler: Maybe<Scheduler>
  private tableInfo: Maybe<PlanTableInfo>

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
    if (index !== -1) {
      this.observers.splice(index, 1)
    }
  }

  notifyObservers(params: Parameters<Observer['update']>[0]): void {
    this.observers.forEach((observer) => observer.update(params))
  }

  constructor(
    private app: App,
    private parser: Parser,
    private file: PlanFile,
    private settings: SuperPlanSettings,
    private statusBar: HTMLElement
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
      if (options['progressType']) {
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

  private async beginActivity(activity: ScheduledActivity) {
    throw new Error('Method not implemented.')
  }

  private async jump2ActivityRow(activity: ScheduledActivity) {
    if (!this.tableInfo || !this.scheduler) return
    const { workspace } = this.app

    const file = this.file.todayFile

    if (!file) return

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
      isAllDone: false,
    }

    if (!this.scheduler) return initialState

    const nowMins = getNowMins()
    const nowIndex = findLastIndex(
      this.scheduler.activities,
      (a) => nowMins >= a.start && a.isFixed
    )
    const now = this.scheduler.activities[nowIndex]

    if (nowIndex === this.scheduler.activities.length - 1 && nowMins >= now.stop) {
      return {
        ...initialState,
        now,
        isAllDone: true,
      }
    }

    const durationMins = nowMins - now.start
    const durationSecs = durationMins * 60 + new Date().getSeconds()
    const totalMins = now.actLen
    const totalSecs = totalMins * 60
    const progress = (durationSecs / totalSecs) * 100

    const next = find(this.scheduler.activities, (a) => a.actLen >= 0, nowIndex + 1)

    return {
      ...initialState,
      now,
      next,
      progress: progress <= 100 ? progress : 100,
      leftSecs: totalSecs - durationSecs,
      leftMins: totalMins - durationMins,
      isAllDone: false,
    }
  }

  private async onTick() {
    if (!this.scheduler) return

    const { leftSecs, ...props } = this.computeProgress()

    this.updateStatusBar(props)
    const { now, next, progress } = props

    if (!isEqual(now, this.now)) {
      this.prev = this.now
      this.now = now
    }

    const ongoing: Ongoing | null = now
      ? {
          activity: now,
          leftSecs,
          progress,
        }
      : null

    const upcoming: Upcoming | null = next
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
        next &&
          next.isFixed &&
          nowMinsSecs === 59 &&
          nowMins + 1 >= next.start - this.settings.minsLeftToSendNotification
      )
      const isNowWillStop = Boolean(
        this.now && nowMins >= this.now.stop - this.settings.minsLeftToSendNotification
      )

      // check this.prev: prevent sending a notification at the start
      if (
        ((this.prev && isNowWillStop) || isNextWillStart) &&
        this.lastSendNotificationActivity !== this.now
      ) {
        const content = isNextWillStart
          ? `A fixed activity will start soon, time to move on.`
          : `It's time to begin the next activity!`
        new Notification(content)
        this.lastSendNotificationActivity = this.now

        // TODO: Jump to next activity row
        // notification.addEventListener("click", () => {});
      }
    }
  }

  setData(activitiesData: Maybe<Activity[]>, tableInfo: Maybe<PlanTableInfo>) {
    this.scheduler = activitiesData ? new Scheduler(activitiesData) : null
    this.tableInfo = tableInfo
    this.updateStatusBar(this.computeProgress())
  }
}
