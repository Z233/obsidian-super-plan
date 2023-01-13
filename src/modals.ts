import { isEqual } from 'lodash-es'
import { Modal, Notice, type App } from 'obsidian'
import type { PlanEditor } from './plan-editor'
import type { PlanTracker } from './plan-tracker'
import { generateActivityData, getNowMins } from './utils/helper'

export class SplitConfirmModal extends Modal {
  private readonly pe: PlanEditor
  private readonly tracker: PlanTracker

  constructor(app: App, pe: PlanEditor, tracker: PlanTracker) {
    super(app)
    this.pe = pe
    this.tracker = tracker
  }

  onOpen() {
    const cursor = this.pe.getCursorActivityData()
    if (!cursor) {
      new Notice('No activity under cursor.')
      this.close()
      return
    }

    const { data } = cursor
    const nowData =
      this.tracker.now && generateActivityData(this.tracker.now)
    const isNowData = isEqual(nowData, data)
    const maxLength = Math.max(+data.length, +data.actLen) - 1

    this.titleEl.textContent = 'Split activity'

    this.contentEl.createEl('label', undefined, (el) => {
      el.textContent = 'Length of first sub-slot: '
      el.setAttribute('for', 'length')
    })

    const inputEl = this.contentEl.createEl(
      'input',
      undefined,
      (el) => {
        el.value = isNowData
          ? `${getNowMins() - this.tracker.now!.start}`
          : maxLength.toString()
        el.setAttribute('style', 'margin: 0 var(--size-4-2)')
        el.setAttribute('id', 'length')
        el.setAttribute('type', 'number')
        el.setAttribute('min', '1')
        el.setAttribute('max', maxLength.toString())
      }
    )

    this.contentEl.createEl('label', undefined, (el) => {
      el.textContent = `(range: 1..${maxLength})`
      el.setAttribute('for', 'length')
    })

    const buttonContainerEl = this.contentEl.createDiv()
    buttonContainerEl.addClass('modal-button-container')
    buttonContainerEl.createEl('button', undefined, (el) => {
      el.textContent = 'Confirm'
      el.addClass('mod-cta')
      el.onclick = () => {
        const inputLength = +inputEl.value
        if (inputLength > maxLength) {
          new Notice(`Input length can't max than ${maxLength}.`)
          return
        }
        this.pe.splitActivity(
          inputLength,
          maxLength - inputLength + 1
        )
        this.close()
      }
    })
    buttonContainerEl.createEl('button', undefined, (el) => {
      el.textContent = 'Cancel'
      el.onclick = () => this.close()
    })
  }

  onClose() {
    const { contentEl } = this
    contentEl.empty()
  }
}
