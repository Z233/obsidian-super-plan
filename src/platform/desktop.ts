import { FileSystemAdapter, Notice, getIcon } from 'obsidian'
import { PlanFile } from 'src/file'
import type SuperPlan from 'src/main'
import { Parser } from 'src/parser'
import { PlanTracker } from 'src/tracker/plan-tracker'
import { Timer } from 'src/tracker/timer'
import type { Activity, Maybe } from 'src/types'
import { shallowCompare } from 'src/util/helper'
import { MiniTracker } from 'src/window'

function desktopInit(plugin: SuperPlan) {
  const app = plugin.app
  const settings = plugin.settings
  const statusBar = plugin.addStatusBarItem()
  
  const parser = new Parser(settings)
  const file = new PlanFile(app.vault, parser, settings)
  const timer = Timer.new()

  const tracker = new PlanTracker(app, parser, file, settings, statusBar)

  let prevActGroups: Maybe<Activity[][]> = null
  const tick = async () => {
    const content = await file.getTodayPlanFileContent()
    if (content) {
      const tableInfos = parser.extractPlanTables(content)
      if (tableInfos && tableInfos.length) {
        const actGroups = tableInfos.map((info) => parser.transformTable(info.table))
        if (!prevActGroups || !shallowCompare(actGroups, prevActGroups)) {
          prevActGroups = actGroups
          tracker.setData(actGroups)
        }
      } else {
        tracker.setData(null)
      }
    }
  }

  tick()
  timer.onTick(tick)
  tracker.init()

  settings.enableMiniTracker && miniTrackerInit(plugin, tracker)
}

function miniTrackerInit(plugin: SuperPlan, tracker: PlanTracker) {
  const { settings, store, manifest } = plugin
  let open = settings.enableMiniTracker

  const ribbonIconId = open ? 'alarm-clock-off' : 'alarm-clock'
  const ribbon = plugin.addRibbonIcon(ribbonIconId, 'Toggle mini tracker', () => undefined)

  const openedIconSVG = getIcon('alarm-clock-off')!
  const closedIconSVG = getIcon('alarm-clock')!

  let miniTracker: Maybe<MiniTracker> = null

  function showMiniTracker() {
    miniTracker = MiniTracker.new(store, tracker)

    let windowFolder: string | undefined
    const pluginDir = manifest.dir
    if (app.vault.adapter instanceof FileSystemAdapter && pluginDir)
      windowFolder = app.vault.adapter.getFullPath(`${pluginDir}/window`)

    if (!windowFolder) {
      const errMsg = `can't init mini tracker window.`
      // FIXME
      // eslint-disable-next-line no-new
      new Notice(`Error: ${errMsg}`)
      throw new Error(errMsg)
    }

    miniTracker.open()

    ribbon.firstChild?.remove()
    ribbon.appendChild(openedIconSVG)

    miniTracker.onClose(() => {
      if (__DEV__)
        return
      closeMiniTracker()
    })

    open = true
  }

  function closeMiniTracker() {
    ribbon.firstChild?.remove()
    ribbon.appendChild(closedIconSVG)

    if (miniTracker?.isOpen)
      miniTracker?.close()

    open = false
  }

  if (open)
    showMiniTracker()

  ribbon.onclick = () => {
    if (open)
      closeMiniTracker()
    else
      showMiniTracker()
  }
}

export { desktopInit }
