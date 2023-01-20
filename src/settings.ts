import { FormatType, optionsWithDefaults } from '@tgrosinger/md-advanced-tables'
import type { Options } from '@tgrosinger/md-advanced-tables'
import { DEFAULT_NOTE_FORMAT, ProgressType } from './constants'
import type SuperPlan from './main'

interface PlanEditorSettings {
  formatType: FormatType
}

interface PlanTrackerSettings {
  dailyPlanNoteFolder: string
  dailyPlanNoteFormat: string

  minsLeftToSendNotice: number

  progressType: ProgressType
}

type ISettings = PlanEditorSettings & PlanTrackerSettings

export const defaultSettings: Partial<ISettings> = {
  // PlanEditorSettings
  formatType: FormatType.NORMAL,

  // PlanTrackerSettings
  dailyPlanNoteFolder: '/',
  dailyPlanNoteFormat: DEFAULT_NOTE_FORMAT,
  progressType: ProgressType.BAR,
  minsLeftToSendNotice: 0,
}

type SettingsUpdateCallback = (options: Partial<ISettings>) => void

export class SuperPlanSettings implements ISettings {
  private readonly plugin: SuperPlan
  private updateCbs: SettingsUpdateCallback[] = []

  formatType: FormatType

  dailyPlanNoteFolder: string
  dailyPlanNoteFormat: string
  progressType: ProgressType
  minsLeftToSendNotice: number

  constructor(plugin: SuperPlan, loadedData: ISettings) {
    this.plugin = plugin

    const allFields = { ...defaultSettings, ...loadedData }
    Object.assign(this, allFields)
  }

  asOptions(): Options {
    return optionsWithDefaults({ formatType: this.formatType })
  }

  update(options: Partial<ISettings>) {
    Object.assign(this, options)
    this.plugin.saveSettings()
    this.updateCbs.forEach((fn) => fn(options))
  }

  onUpdate(cb: SettingsUpdateCallback) {
    this.updateCbs.push(cb)
  }

  serialize() {
    const obj: Record<string, string> = {}
    for (const key in this) {
      if (typeof this[key] === 'string') {
        obj[key] = this[key] as any as string
      }
    }
    return obj
  }
}
