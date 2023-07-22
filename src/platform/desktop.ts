import { FileSystemAdapter, Notice, getIcon } from 'obsidian'
import { PlanFile } from 'src/file'
import type SuperPlan from 'src/main'
import { Parser } from 'src/parser'
import { PlanTracker } from 'src/tracker/plan-tracker'
import { Timer } from 'src/tracker/timer'
import type { Maybe, Activity } from 'src/types'
import { shallowCompare } from 'src/util/helper'
import { MiniTracker } from 'src/window'

function desktopInit(plugin: SuperPlan) {
  const app = plugin.app
  const manifest = plugin.manifest
  const settings = plugin.settings
  const store = plugin.store
  const statusBar = plugin.addStatusBarItem()

  const parser = new Parser(settings)
  const file = new PlanFile(app.vault, parser, settings)
  const timer = Timer.new()

  const tracker = new PlanTracker(app, parser, file, settings, statusBar)

  let lastActivitiesData: Maybe<Activity[]> = null
  const tick = async () => {
    const content = await file.getTodayPlanFileContent()
    if (content) {
      const tableInfo = parser.findPlanTableV2(content)
      if (tableInfo) {
        const activitiesData = parser.transformTable(tableInfo.table)
        if (!lastActivitiesData || !shallowCompare(activitiesData, lastActivitiesData)) {
          lastActivitiesData = activitiesData
          tracker.setData(activitiesData, tableInfo)
        }
      } else {
        tracker.setData(null, null)
      }
    }
  }

  tick()
  timer.onTick(tick)

  tracker.init()

  const ribbonIconId = settings.enableMiniTracker ? 'alarm-clock-off' : 'alarm-clock'
  const ribbon = plugin.addRibbonIcon(ribbonIconId, 'Toggle mini tracker', () => void 0)

  const openedIconSVG = getIcon('alarm-clock-off')!
  const closedIconSVG = getIcon('alarm-clock')!

  let miniTracker: Maybe<MiniTracker> = null

  const enableMiniTracker = () => {
    miniTracker = MiniTracker.new(store, tracker)

    let windowFolder: string | undefined
    const pluginDir = manifest.dir
    if (app.vault.adapter instanceof FileSystemAdapter && pluginDir) {
      windowFolder = app.vault.adapter.getFullPath(`${pluginDir}/window`)
    }

    if (!windowFolder) {
      const errMsg = `can't init mini tracker window.`
      new Notice(`Error: ${errMsg}`)
      throw new Error(errMsg)
    }

    miniTracker.open(windowFolder)
    ribbon.firstChild?.remove()
    ribbon.appendChild(openedIconSVG)
  }

  if (settings.enableMiniTracker) enableMiniTracker()

  ribbon.onclick = () => {
    if (settings.enableMiniTracker) {
      // Disable mini tracker
      ribbon.firstChild?.remove()
      ribbon.appendChild(closedIconSVG)
      miniTracker?.close()

      plugin.settings.update({
        enableMiniTracker: false,
      })
    } else {
      enableMiniTracker()

      plugin.settings.update({
        enableMiniTracker: true,
      })
    }
  }
}

export { desktopInit }
