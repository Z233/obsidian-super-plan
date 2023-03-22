import { Modal, Notice, type App } from 'obsidian'
import type { Activity, ActivityData } from 'src/types'
import type { TableEditor } from '../editor/table-editor'
import { getNowMins, parseTime2Mins } from '../util/helper'

type SplitData = {
  firstLength: number
  secondLength: number
}

type Result<T = unknown> = {
  ok: boolean
  data?: T
}

export class SplitConfirmModalV2 extends Modal {
  private activity: ActivityData
  private closeResolve: (value: Result<SplitData>) => void
  private modalPromise = () =>
    new Promise<Result<SplitData>>((resolve) => (this.closeResolve = resolve))

  constructor(app: App, activity: ActivityData) {
    super(app)
    this.activity = activity
  }

  private _buildModalContent() {
    const { start } = this.activity
    const actLen = +this.activity.actLen
    const length = +this.activity.length

    const nowMins = getNowMins()
    const minsPassed = nowMins - parseTime2Mins(start)
    const isOngoing = minsPassed > 0 && minsPassed <= +actLen

    const maxLength = Math.max(length, actLen) - 1

    this.titleEl.textContent = 'Split activity'

    this.contentEl.createEl('label', undefined, (el) => {
      el.textContent = 'Length of first sub-slot: '
      el.setAttribute('for', 'length')
    })

    const inputEl = this.contentEl.createEl('input', undefined, (el) => {
      el.value = isOngoing ? minsPassed.toString() : Math.floor(maxLength / 2).toString()
      el.setAttribute('style', 'margin: 0 var(--size-4-2)')
      el.setAttribute('id', 'length')
      el.setAttribute('type', 'number')
      el.setAttribute('min', '1')
    })

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
        this.confirm({
          firstLength: inputLength,
          secondLength: maxLength - inputLength,
        })
      }
    })
    buttonContainerEl.createEl('button', undefined, (el) => {
      el.textContent = 'Cancel'
      el.onclick = () => this.close()
    })
  }

  open() {
    super.open()

    this._buildModalContent()

    return this.modalPromise()
  }

  confirm(data: SplitData) {
    super.close()
    this.closeResolve({
      ok: true,
      data,
    })
  }

  close() {
    super.close()
    this.closeResolve({
      ok: false,
    })
  }

  onClose() {
    const { contentEl } = this
    contentEl.empty()
  }
}

export class SplitConfirmModal extends Modal {
  private readonly pe: TableEditor

  constructor(app: App, pe: TableEditor) {
    super(app)
    this.pe = pe
  }

  onOpen() {
    const cursor = this.pe.getCursorActivityData()
    if (!cursor) {
      new Notice('No activity under cursor.')
      this.close()
      return
    }

    const { data } = cursor

    const nowMins = getNowMins()
    const minsPassed = nowMins - parseTime2Mins(data.start)
    const isOngoing = minsPassed > 0 && minsPassed <= +data.actLen

    const maxLength = Math.max(+data.length, +data.actLen) - 1

    this.titleEl.textContent = 'Split activity'

    this.contentEl.createEl('label', undefined, (el) => {
      el.textContent = 'Length of first sub-slot: '
      el.setAttribute('for', 'length')
    })

    const inputEl = this.contentEl.createEl('input', undefined, (el) => {
      el.value = isOngoing ? minsPassed.toString() : Math.floor(maxLength / 2).toString()
      el.setAttribute('style', 'margin: 0 var(--size-4-2)')
      el.setAttribute('id', 'length')
      el.setAttribute('type', 'number')
      el.setAttribute('min', '1')
      el.setAttribute('max', maxLength.toString())
    })

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
        this.pe.splitActivity(inputLength, maxLength - inputLength + 1)
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
