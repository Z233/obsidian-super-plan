import { normalizePath, Notice, type Vault } from 'obsidian'
import type { Parser } from './parser'
import type { SuperPlanSettings } from './settings'
import { _createIsTableRowRegex } from '@tgrosinger/md-advanced-tables/lib/table-editor'
import moment from 'moment'
import { DEFAULT_PLAN_NOTE_CONTENT } from './constants'

export class PlanFile {
  private readonly vault: Vault
  private readonly parser: Parser
  private readonly settings: SuperPlanSettings

  constructor(
    vault: Vault,
    parser: Parser,
    settings: SuperPlanSettings
  ) {
    this.vault = vault
    this.parser = parser
    this.settings = settings
  }

  get todayPlanFileName(): string {
    const fileDate = moment().format(this.settings.fileNameDateFormat)
    const fileName = `${
      this.settings.fileNamePrefix.trim() ?? ''
    }${fileDate}.md`
    return fileName
  }

  get todayPlanFilePath(): string {
    return `${this.settings.planFolder ?? ''}/${
      this.todayPlanFileName
    }`
  }

  get todayFile() {
    return this.vault
      .getFiles()
      .find((f) => f.path === normalizePath(this.todayPlanFilePath))
  }

  async getTodayPlanFileContent() {
    await this.prepareFile()
    return this.vault.adapter.read(this.todayPlanFilePath)
  }

  async updateTodayPlanFile(content: string) {
    try {
      return await this.vault.adapter.write(
        this.todayPlanFilePath,
        content
      )
    } catch (error) {
      console.error(error)
    }
  }

  async prepareFile() {
    try {
      await this.createFolderIfNotExists(this.settings.planFolder)
      await this.createFileIfNotExists(this.todayPlanFilePath)
    } catch (error) {
      console.log(error)
    }
  }

  async createFolderIfNotExists(path: string) {
    try {
      const normalizedPath = normalizePath(path)
      const folderExists = await this.vault.adapter.exists(
        normalizedPath,
        false
      )
      if (!folderExists) {
        await this.vault.createFolder(normalizedPath)
      }
    } catch (error) {
      console.log(error)
    }
  }

  async createFileIfNotExists(fileName: string) {
    const content = await this.getTemplateContent()
    try {
      const normalizedFileName = normalizePath(fileName)
      if (
        !(await this.vault.adapter.exists(normalizedFileName, false))
      ) {
        await this.vault.create(normalizedFileName, content)
      }
    } catch (error) {
      console.log(error)
    }
  }

  async getTemplateContent(): Promise<string> {
    const { metadataCache, vault } = window.app
    const templatePath = normalizePath(this.settings.noteTemplate)

    if (templatePath === '/') {
      return DEFAULT_PLAN_NOTE_CONTENT
    }

    try {
      const templateFile = metadataCache.getFirstLinkpathDest(
        templatePath,
        ''
      )
      if (!templateFile) return DEFAULT_PLAN_NOTE_CONTENT
      const contents = await vault.cachedRead(templateFile)

      return contents
    } catch (err) {
      console.error(
        `Failed to read the day planner template '${templatePath}'`,
        err
      )
      new Notice('Failed to read the day planner template')
      return DEFAULT_PLAN_NOTE_CONTENT
    }
  }
}
