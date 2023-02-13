import { FormatType, optionsWithDefaults } from '@tgrosinger/md-advanced-tables'
import type { Options } from '@tgrosinger/md-advanced-tables'
import { DEFAULT_NOTE_FORMAT, ProgressType } from '../constants'
import type SuperPlan from '../main'
import { checkIsDataviewEnabled } from '../util/helper'

interface PlanEditorSettings {
  planTableId: string
  formatType: FormatType
  enableActivityAutoCompletion: boolean
}

interface PlanTrackerSettings {
  dailyPlanNoteFolder: string
  dailyPlanNoteFormat: string

  minsLeftToSendNotice: number

  progressType: ProgressType
  enableMiniTracker: boolean
}

export type ISettings = PlanEditorSettings & PlanTrackerSettings

export const defaultSettings: Partial<ISettings> = {
  // PlanEditorSettings
  planTableId: 'plan',
  formatType: FormatType.NORMAL,
  enableActivityAutoCompletion: checkIsDataviewEnabled(),

  // PlanTrackerSettings
  dailyPlanNoteFolder: '/',
  dailyPlanNoteFormat: DEFAULT_NOTE_FORMAT,
  progressType: ProgressType.BAR,
  minsLeftToSendNotice: 0,
  enableMiniTracker: false,
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
  minsLeftToSendNotice: number
  enableMiniTracker: boolean

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
      if (['string', 'number', 'boolean'].includes(typeof this[key])) {
        obj[key] = this[key] as any
      }
    }
    return obj as unknown as ISettings
  }
}
