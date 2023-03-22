import { Menu } from 'obsidian'

type PlanMenuCallback = () => void

export class PlanMenu extends Menu {
  constructor(
    options: Partial<{
      onBegin: PlanMenuCallback
      onCancel: PlanMenuCallback
      onSplit: PlanMenuCallback
      onDeleteRow: PlanMenuCallback
    }>
  ) {
    super()

    options.onBegin && this.addMenuItem('Begin', 'play', options.onBegin)
    options.onCancel && this.addMenuItem('Cancel', 'x', options.onCancel)
    options.onSplit && this.addMenuItem('Split', 'divide', options.onSplit)
    options.onDeleteRow && this.addMenuItem('Delete', 'trash', options.onDeleteRow)
  }

  private addMenuItem(title: string, icon: string, callback: PlanMenuCallback) {
    this.addItem((item) => {
      item
        .setTitle(title)
        .setIcon(icon)
        .onClick(() => callback())
    })
  }
}
