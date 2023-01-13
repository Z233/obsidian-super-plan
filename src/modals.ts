import { Modal, Notice, type App } from 'obsidian'
import type { PlanEditor } from './plan-editor'

export class SplitConfirmModal extends Modal {
  private readonly pe: PlanEditor

  constructor(app: App, pe: PlanEditor) {
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
        el.value = maxLength.toString()
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
