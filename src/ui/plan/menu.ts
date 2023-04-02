import { Menu } from 'obsidian'

export type PlanMenuItem = {
  title: string
  icon: string
  callback?: PlanMenuCallback
}
type PlanMenuCallback = () => void

export class PlanMenu extends Menu {
  constructor(menuItems: PlanMenuItem[]) {
    super()
    this.addMenuItems(menuItems)
  }

  private addMenuItems(menuItems: PlanMenuItem[]) {
    menuItems.forEach((item) => {
      this.addItem((i) => {
        i.setTitle(item.title)
          .setIcon(item.icon)
          .onClick(() => item.callback?.())
      })
    })
  }

}
