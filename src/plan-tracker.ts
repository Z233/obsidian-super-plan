import { Plan } from './plan'
import { timer } from './timer'
import type { ActivitiesData, Activity, Maybe, PlanTableInfo } from './types'
import { getNowMins } from './utils/helper'
import StatusBar from './components/StatusBar.svelte'
import type { Parser } from './parser'
import type { PlanFile } from './plan-file'
import type { SuperPlanSettings } from './settings'
import { find, findLastIndex, isEqual } from 'lodash-es'
import { MarkdownView, type App, type Workspace } from 'obsidian'
import { CURSOR_CH_AFTER_FOCUS } from './constants'

type StatusBarProps = StatusBar['$$prop_def']

export class PlanTracker {
  private readonly statusBarEl: HTMLElement
  private readonly parser: Parser
  private readonly file: PlanFile
  private readonly settings: SuperPlanSettings
  private readonly app: App

  private plan: Maybe<Plan>
  private tableInfo: Maybe<PlanTableInfo>

  private statusBarComp: StatusBar

  now: Maybe<Activity>
  private prev: Maybe<Activity>
  private next: Maybe<Activity>

  private lastSendNotificationActivity: Maybe<Activity>

  constructor(
    app: App,
    parser: Parser,
    file: PlanFile,
    settings: SuperPlanSettings,
    statusBar: HTMLElement
  ) {
    this.app = app
    this.parser = parser
    this.file = file
    this.settings = settings
    this.statusBarEl = statusBar
  }

  init() {
    this.statusBarComp = new StatusBar({
      target: this.statusBarEl,
      props: {
        now: this.now,
        next: this.next,
        progressType: this.settings.progressType,
        jump2ActivityRow: this.jump2ActivityRow.bind(this),
      },
    })

    this.settings.onUpdate((options) => {
      if (options['progressType']) {
        this.statusBarComp.$set({
          progressType: options.progressType,
        })
      }
    })

    timer.onTick(this.onTick.bind(this))
  }

  private updateStatusBar(props: StatusBarProps) {
    this.statusBarComp.$set(props)
  }
  private async jump2ActivityRow(activity: Activity) {
    if (!this.tableInfo || !this.plan) return
    const { workspace } = this.app

    const file = this.file.todayFile

    if (!file) return

    const activeView = workspace.getActiveViewOfType(MarkdownView)
    const shouldOpenFile = !(activeView && file && activeView.file === file)

    if (shouldOpenFile) {
      const leaf = workspace.getLeaf()
      await leaf.openFile(file, { active: true })
    }

    const editor = workspace.activeEditor!.editor!

    const { range } = this.tableInfo

    const activityIndex = this.plan.activities.findIndex((a) => isEqual(a, activity))
    const rowIndex = activityIndex + 2

    editor.focus()
    editor.setCursor(range.start.row + rowIndex, CURSOR_CH_AFTER_FOCUS)
    editor.scrollIntoView(
      {
        from: {
          line: range.start.row,
          ch: CURSOR_CH_AFTER_FOCUS,
        },
        to: {
          line: range.start.row,
          ch: CURSOR_CH_AFTER_FOCUS,
        },
      },
      true
    )
  }

  private getStatusBarProps(): StatusBarProps {
    if (!this.plan)
      return {
        now: null,
        next: null,
        isAllDone: false,
      }
    const nowMins = getNowMins()
    const nowIndex = findLastIndex(this.plan.activities, (a) => nowMins >= a.start && a.isFixed)
    const now = this.plan.activities[nowIndex]

    if (nowIndex === this.plan.activities.length - 1 && nowMins >= now.stop) {
      return {
        now,
        next: null,
        isAllDone: true,
      }
    }

    const durationMins = nowMins - now.start
    const durationSecs = durationMins * 60 + new Date().getSeconds()
    const totalMins = now.actLen
    const totalSecs = totalMins * 60
    const progress = (durationSecs / totalSecs) * 100

    const next = find(this.plan.activities, (a) => a.actLen > 0, nowIndex + 1)

    return {
      now,
      next,
      progress: progress <= 100 ? progress : 100,
      leftMins: totalMins - durationMins,
      isAllDone: false,
    }
  }

  private async onTick() {
    if (!this.plan || this.plan.isTemplate) return

    const props = this.getStatusBarProps()
    this.updateStatusBar(props)

    const { now, next } = props

    if (!isEqual(now, this.now)) {
      this.prev = this.now
      this.now = now
    }

    const nowMins = getNowMins()
    const nowMinsSecs = new Date().getSeconds()

    // a fixed activity will begin
    const isNextWillStart = Boolean(
      next &&
        next.isFixed &&
        nowMinsSecs === 59 &&
        nowMins + 1 >= next.start - this.settings.minsLeftToSendNotice
    )
    const isNowWillStop = Boolean(
      this.now && nowMins >= this.now.stop - this.settings.minsLeftToSendNotice
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

  setData(activitiesData: Maybe<ActivitiesData>, tableInfo: Maybe<PlanTableInfo>) {
    this.plan = activitiesData ? new Plan(activitiesData) : null
    this.tableInfo = tableInfo
    this.updateStatusBar(this.getStatusBarProps())
  }
}
