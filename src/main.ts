import { Platform, Plugin } from 'obsidian'
import type { Editor } from 'obsidian'
import sentinel from 'sentinel-js'
import { SuperPlanSettings, defaultSettings } from './setting/settings'
import { SuperPlanSettingsTab } from './setting/settings-tab'
import { MiniTracker } from './window'
import { DataStore, SettingsDataKey } from './store'
import { loadIcons } from './ui/icons'
import { desktopInit } from './platform/desktop'
import { Timer } from './tracker/timer'
import './style.css'
import { PlanBuilder } from './editor/plan-builder'
import { generateId, getNowMins, parseMins2Time } from './util/helper'
import { ACTIVITY_TR_ID_PREFIX, CODE_BLOCK_LANG } from './constants'
import { PlanTableManager } from './plan-table-manager'

export default class SuperPlan extends Plugin {
  settings: SuperPlanSettings
  store: DataStore

  private planTableManager: PlanTableManager

  async onload() {
    this.store = new DataStore(this)

    await this.loadSettings()
    this.addSettingTab(new SuperPlanSettingsTab(this.app, this))

    if (Platform.isDesktopApp) {
      const timer = Timer.new()

      this.registerInterval(timer.intervalId)

      desktopInit(this)
    }

    this.planTableManager = PlanTableManager.new(this.app, this.settings)
    this.registerEditorExtension(this.planTableManager.updateListener)
    this.registerMarkdownCodeBlockProcessor(CODE_BLOCK_LANG, this.planTableManager.codeBlockProcessor)

    loadIcons()

    this.addCommand({
      id: 'insert-new-plan',
      name: 'Insert new plan',
      icon: 'list-plus',
      editorCallback: (editor: Editor) => {
        const builder = new PlanBuilder()

        const firstId = generateId()

        const plan = builder
          .addActivity({
            id: firstId,
            activity: '',
            length: '0',
            start: parseMins2Time(getNowMins()),
            f: 'x',
            r: '',
            actLen: '0',
          })
          .addActivity({
            id: generateId(),
            activity: 'END',
            length: '0',
            start: '',
            f: 'x',
            r: '',
            actLen: '',
          })
          .build()

        const lines = plan.getLines()
        const codeLines = [`\`\`\`${CODE_BLOCK_LANG}`, ...lines, '```']

        const cursor = editor.getCursor()

        const isEmptyLine = editor.getLine(cursor.line).trim() === ''

        editor.replaceRange(`${codeLines.join('\n')}\n`, {
          line: isEmptyLine ? cursor.line : cursor.line + 1,
          ch: 0,
        })

        isEmptyLine && editor.setCursor(cursor.line + codeLines.length + 1, 0)

        /**
         * We can't use css selector to select input
         * because the input element use "all: unset"
         * to reset all styles set by obsidian.
         */
        const actCellSelector = `tr#${ACTIVITY_TR_ID_PREFIX}${firstId} > td[data-column="activity"]`

        const focusOnActInput = (td: HTMLTableCellElement) => {
          const input = td.firstChild as HTMLInputElement
          input.focus()
          sentinel.off(actCellSelector, focusOnActInput)
        }

        sentinel.on(actCellSelector, focusOnActInput)
      },
    })
  }

  onunload() {
    Timer.clean()
    MiniTracker.clean()

    this.planTableManager.unregister()
  }

  async loadSettings() {
    const data = await this.store.get(SettingsDataKey)
    const settingsOptions = Object.assign(defaultSettings, data)
    this.settings = new SuperPlanSettings(this, settingsOptions)
    this.saveSettings()
  }

  async saveSettings() {
    await this.store.set(SettingsDataKey, this.settings.serialize())
  }
}
