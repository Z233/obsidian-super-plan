import { Menu } from 'obsidian'

type PlanMenuCallback = () => void

export class PlanMenu extends Menu {
  constructor(options: { onDeleteRow: PlanMenuCallback; onBegin: PlanMenuCallback }) {
    super()

    this.addMenuItem('Begin', 'play', options.onBegin)
    this.addMenuItem('Delete', 'trash', options.onDeleteRow)
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
