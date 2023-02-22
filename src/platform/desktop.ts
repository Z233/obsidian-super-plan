import { App, FileSystemAdapter, Notice, type PluginManifest } from 'obsidian'
import { PlanFile } from 'src/file'
import { Parser } from 'src/parser'
import type { SuperPlanSettings } from 'src/setting/settings'
import type { DataStore } from 'src/store'
import { PlanTracker } from 'src/tracker/plan-tracker'
import { Timer } from 'src/tracker/timer'
import type { Maybe, ActivitiesData } from 'src/types'
import { MiniTracker } from 'src/window'

function desktopInit(
  app: App,
  manifest: PluginManifest,
  settings: SuperPlanSettings,
  store: DataStore,
  statusBar: HTMLElement
) {
  const parser = new Parser(settings)
  const file = new PlanFile(app.vault, parser, settings)
  const timer = Timer.new()

  const tracker = new PlanTracker(app, parser, file, settings, statusBar)

  let lastActivitiesData: Maybe<ActivitiesData> = null
  const tick = async () => {
    const content = await file.getTodayPlanFileContent()
    if (content) {
      const tableInfo = parser.findPlanTable(content)
      if (tableInfo) {
        const { table } = tableInfo
        const activitiesData = parser.transformTable(table)
        if (!Object.is(activitiesData, lastActivitiesData)) {
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

  if (settings.enableMiniTracker) {
    const miniTracker = MiniTracker.new(store, tracker)

    let windowFolder: string | undefined
    const pluginDir = manifest.dir
    if (app.vault.adapter instanceof FileSystemAdapter && pluginDir) {
      windowFolder = app.vault.adapter.getFullPath(`${pluginDir}/window`)
    }

    if (windowFolder) {
      miniTracker.open(windowFolder)
    } else {
      new Notice(`Error: can't init mini tracker window.`)
    }
  } else {
    MiniTracker.clean()
  }
}

export { desktopInit }
