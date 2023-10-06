import { FormatType, optionsWithDefaults } from '@tgrosinger/md-advanced-tables'
import type { Options } from '@tgrosinger/md-advanced-tables'
import { DEFAULT_NOTE_FORMAT, ProgressType } from '../constants'
import type SuperPlan from '../main'

interface PlanEditorSettings {
  planTableId: string
  formatType: FormatType
  enableActivityAutoCompletion: boolean
}

interface PlanTrackerSettings {
  dailyPlanNoteFolder: string
  dailyPlanNoteFormat: string

  enableNotification: boolean
  minsLeftToSendNotification: number

  progressType: ProgressType
  enableMiniTracker: boolean
  showMiniTracker: boolean
}

export type ISettings = PlanEditorSettings & PlanTrackerSettings

export const defaultSettings: ISettings = {
  // PlanEditorSettings
  planTableId: 'plan',
  formatType: FormatType.NORMAL,
  enableActivityAutoCompletion: false,

  // PlanTrackerSettings
  dailyPlanNoteFolder: '/',
  dailyPlanNoteFormat: DEFAULT_NOTE_FORMAT,
  progressType: ProgressType.BAR,

  enableNotification: true,
  minsLeftToSendNotification: 0,

  enableMiniTracker: false,
  showMiniTracker: true,
}

type SettingsUpdateCallback = (options: Partial<ISettings>) => void

export class SuperPlanSettings implements ISettings {
  private readonly plugin: SuperPlan
  private updateCbs: SettingsUpdateCallback[] = []

  planTableId: string
  formatType: FormatType
  enableActivityAutoCompletion: boolean

  dailyPlanNoteFolder: string
  dailyPlanNoteFormat: string
  progressType: ProgressType

  enableNotification: boolean
  minsLeftToSendNotification: number

  enableMiniTracker: boolean
  showMiniTracker: boolean

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
    this.updateCbs.forEach(fn => fn(options))
  }

  onUpdate(cb: SettingsUpdateCallback) {
    this.updateCbs.push(cb)
  }

  serialize() {
    const obj: Record<string, string> = {}
    for (const key in this) {
      if (['string', 'number', 'boolean'].includes(typeof this[key]))
        obj[key] = this[key] as any
    }
    return obj as unknown as ISettings
  }
}
