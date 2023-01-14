import { App, normalizePath, PluginSettingTab, Setting } from 'obsidian'
import { ProgressType } from './constants'
import { FileSuggest, FileSuggestMode, FolderSuggest } from './file-suggester'
import type SuperPlan from './main'

export class SuperPlanSettingsTab extends PluginSettingTab {
  private readonly plugin: SuperPlan
  private error: string

  constructor(app: App, plugin: SuperPlan) {
    super(app, plugin)
    this.plugin = plugin
  }

  private validateFolder(folder: string): string {
    if (!folder || folder === '/') {
      return ''
    }

    const { vault } = window.app
    if (!vault.getAbstractFileByPath(normalizePath(folder))) {
      return 'Folder not found in vault'
    }

    return ''
  }

  display() {
    const { containerEl } = this

    containerEl.empty()

    const createSetting = () => new Setting(containerEl)

    new Setting(containerEl)
      .setName('Plan Note Folder')
      .addSearch((cb) => {
        new FolderSuggest(this.app, cb.inputEl)

        cb.setPlaceholder('Folder')
          .setValue(this.plugin.settings.planFolder)
          .onChange((value: string) => {
            this.error = this.validateFolder(value)
            this.plugin.settings.planFolder = value
            this.plugin.saveData(this.plugin.settings)
          })

        containerEl.addClass('day-planner-search')
      })
      .setDesc('Folder where auto-created notes will be saved')

    new Setting(containerEl)
      .setName('Plan Note Template')
      .addSearch((cb) => {
        new FileSuggest(this.app, cb.inputEl, this.plugin, FileSuggestMode.TemplateFiles)

        cb.setPlaceholder('Template')
          .setValue(this.plugin.settings.noteTemplate)
          .onChange((value: string) => {
            this.plugin.settings.noteTemplate = value
            this.plugin.saveData(this.plugin.settings)
          })

        containerEl.addClass('day-planner-search')
      })
      .setDesc('Choose the file to use as a template.')

    new Setting(containerEl)
      .setName('Custom File Prefix')
      .setDesc('The prefix for your plan note file names')
      .addText((component) =>
        component.setValue(this.plugin.settings.fileNamePrefix ?? '').onChange((value: string) => {
          this.plugin.settings.fileNamePrefix = value
          this.plugin.saveData(this.plugin.settings)
        })
      )

    new Setting(containerEl)
      .setName('File name Date Format')
      .setDesc('The date format for your plan note file names')
      .addDropdown((dropdown) => {
        dropdown.addOption('MM-DD-YYYY', 'MM-DD-YYYY')
        dropdown.addOption('DD-MM-YYYY', 'DD-MM-YYYY')
        dropdown.addOption('YYYYMMDD', 'YYYYMMDD')
        return dropdown
          .setValue(this.plugin.settings.fileNameDateFormat)
          .onChange((value: string) => {
            this.plugin.settings.update({
              fileNameDateFormat: value,
            })
          })
      })

    containerEl.createEl('h2', { text: 'Status Bar' })

    createSetting()
      .setName('Progress Type')
      .addDropdown((dropdown) => {
        dropdown.addOption(ProgressType.BAR, 'Bar')
        dropdown.addOption(ProgressType.CIRCLE, 'Circle')
        return dropdown
          .setValue(this.plugin.settings.progressType)
          .onChange((value: ProgressType) => {
            this.plugin.settings.update({
              progressType: value,
            })
          })
      })
  }
}
