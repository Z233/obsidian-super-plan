import { normalizePath, Notice, type Vault } from 'obsidian'
import type { Parser } from './parser'
import type { SuperPlanSettings } from './setting/settings'
import { _createIsTableRowRegex } from '@tgrosinger/md-advanced-tables/lib/table-editor'
import moment from 'moment'

export class PlanFile {
  private readonly vault: Vault
  private readonly parser: Parser
  private readonly settings: SuperPlanSettings

  constructor(vault: Vault, parser: Parser, settings: SuperPlanSettings) {
    this.vault = vault
    this.parser = parser
    this.settings = settings
  }

  get todayPlanFileName(): string {
    return `${moment().format(this.settings.dailyPlanNoteFormat)}.md`
  }

  get todayPlanFilePath(): string {
    return `${this.settings.dailyPlanNoteFolder ?? ''}/${this.todayPlanFileName}`
  }

  get todayFile() {
    return this.vault.getFiles().find((f) => f.path === normalizePath(this.todayPlanFilePath))
  }

  async getTodayPlanFileContent() {
    const path = normalizePath(this.todayPlanFilePath)
    if (!(await this.vault.adapter.exists(path))) return null
    return this.vault.adapter.read(path)
  }

  async updateTodayPlanFile(content: string) {
    try {
      return await this.vault.adapter.write(this.todayPlanFilePath, content)
    } catch (error) {
      console.error(error)
    }
  }
}
