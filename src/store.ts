import type SuperPlan from './main'
import type { ISettings } from './setting/settings'

export const SettingsDataKey = 'settingsData' as const
export const UserDataKey = 'userData' as const

export type UserData = {
  miniTracker: MiniTrackerData
}

export type MiniTrackerData = {
  position: Record<string, Position | undefined>
}

export type Position = {
  x: number
  y: number
}

type Data = {
  [UserDataKey]?: UserData
  [SettingsDataKey]?: ISettings
}

export class DataStore {
  private data: Data

  constructor(private plugin: SuperPlan) {}

  async get<T extends keyof Data>(key: T): Promise<Data[T]> {
    await this.ensureDataLoaded()
    return this.data[key]
  }

  async set<T extends keyof Data>(key: T, value: Data[T]) {
    await this.ensureDataLoaded()
    this.data[key] = value
    await this.plugin.saveData(this.data)
  }

  private async ensureDataLoaded() {
    if (!this.data) {
      const loadedData = await this.plugin.loadData()
      this.data = loadedData || {}
    }
  }
}
