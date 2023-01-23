import { App, normalizePath, PluginSettingTab, Setting } from 'obsidian'
import { ProgressType } from './constants'
import { FolderSuggest } from './file-suggester'
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

    containerEl.createEl('h2', { text: 'General' })

    new Setting(containerEl)
      .setName('Root Folder')
      .setDesc('The root folder contains all plan notes. ')
      .addSearch((cb) => {
        new FolderSuggest(this.app, cb.inputEl)

        cb.setPlaceholder('Folder')
          .setValue(this.plugin.settings.rootFolder)
          .onChange((value: string) => {
            this.error = this.validateFolder(value)
            this.plugin.settings.rootFolder = value
            this.plugin.settings.update({
              rootFolder: value,
            })
          })
      })

    new Setting(containerEl)
      .setName('Daily Plan Note Folder')
      .setDesc(
        createFragment((fragment) => {
          const lines = [
            'The folder where the daily plan note is placed.',
            'The folder must be the same as or in the root folder.',
            'Tracker will scan the folder to get the daily plan.',
          ]
          lines.forEach((content) => fragment.appendChild(fragment.createDiv({ text: content })))
          return fragment
        })
      )
      .addSearch((cb) => {
        new FolderSuggest(this.app, cb.inputEl)

        cb.setPlaceholder('Folder')
          .setValue(this.plugin.settings.dailyPlanNoteFolder)
          .onChange((value: string) => {
            this.error = this.validateFolder(value)
            this.plugin.settings.dailyPlanNoteFolder = value
            this.plugin.settings.update({
              dailyPlanNoteFolder: value,
            })
          })
      })

    new Setting(containerEl).setName('Daily Plan Note Format').addMomentFormat((comp) => {
      const itemEl = comp.inputEl.closest('.setting-item')!
      const descEl = itemEl.querySelector('.setting-item-description')!

      descEl.createSpan().setText(`The format of the daily plan notes. `)

      descEl.createEl('a', {
        href: 'https://momentjs.com/docs/#/displaying/format/',
        text: 'Syntax Reference',
      })

      descEl.createEl('br')

      descEl.createSpan({ text: 'Your current syntax looks like this: ' })
      const sampleEl = descEl.createSpan({ cls: 'u-pop' })

      comp.setSampleEl(sampleEl)

      return comp.setValue(this.plugin.settings.dailyPlanNoteFormat).onChange((value: string) => {
        this.plugin.settings.update({
          dailyPlanNoteFormat: value,
        })
      })
    })

    containerEl.createEl('h2', { text: 'Tracker' })

    createSetting()
      .setName('Progress Type')
      .setDesc('The type of progress displayed in the status bar.')
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

    createSetting()
      .setName('Minutes Left To Send Notice')
      .setDesc('The minutes before the current activity ends to send a notification.')
      .addText((comp) =>
        comp.setValue(this.plugin.settings.minsLeftToSendNotice.toString()).onChange((value) =>
          this.plugin.settings.update({
            minsLeftToSendNotice: +value,
          })
        )
      )
  }
}
