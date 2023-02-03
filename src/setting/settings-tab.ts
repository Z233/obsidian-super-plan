import { App, normalizePath, PluginSettingTab, Setting } from 'obsidian'
import { ProgressType } from '../constants'
import { FolderSuggest } from '../ui/suggest/file-suggester'
import type SuperPlan from '../main'
import { checkIsDataviewEnabled } from '../util/helper'

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
      .setName('Daily Plan Note Folder')
      .setDesc('The folder where the daily plan attempts to detect.')
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

    let lastEnableActivityAutoCompletion = this.plugin.settings.enableActivityAutoCompletion
    new Setting(containerEl)
      .setName('Enable Activity Name Auto-Completion')
      .setDesc(
        (() => {
          const fragment = new DocumentFragment()
          const el = fragment.createDiv({
            text: 'Requires the ',
          })
          el.createEl('a', {
            text: 'obsidian-dataview',
            href: 'https://github.com/blacksmithgu/obsidian-dataview',
          })
          el.appendText(' to be enabled.')

          if (!checkIsDataviewEnabled()) {
            fragment.createDiv({
              text: 'Dataview is not enabled.',
              cls: 'mod-warning',
            })
          }

          return fragment
        })()
      )
      .addToggle((comp) => {
        comp.disabled = !checkIsDataviewEnabled()
        comp.setValue(this.plugin.settings.enableActivityAutoCompletion).onChange((value) => {
          this.plugin.settings.update({
            enableActivityAutoCompletion: value,
          })

          if (
            !comp.toggleEl.querySelector('.option-restart-hint') &&
            lastEnableActivityAutoCompletion !== value
          ) {
            comp.toggleEl.createDiv({
              text: 'Requires a restart of Obsidian.',
              cls: 'option-restart-hint mod-warning',
            })
          } else {
            const el = comp.toggleEl.querySelector('.option-restart-hint')
            el && el.remove()
          }
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
