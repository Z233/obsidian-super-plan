export enum Events {
  JUMP_TO_ACTIVITY = 'JUMP_TO_ACTIVITY',
  SET_IS_APPLYING_CHANGES = 'SET_IS_APPLYING_CHANGES',
}

type EventsMap = {
  [Events.JUMP_TO_ACTIVITY]: {
    activityId: string
  }
  [Events.SET_IS_APPLYING_CHANGES]: {
    isApplyingChanges: boolean
  }
}

type AllEvents = keyof EventsMap

export class GlobalMediator {
  private static instance: GlobalMediator
  private listeners: { [K in AllEvents]?: ((data: EventsMap[K]) => void)[] } = {}
  private messages: { [K in AllEvents]?: EventsMap[K][] } = {}

  private constructor() {}

  public static getInstance(): GlobalMediator {
    if (!GlobalMediator.instance) {
      GlobalMediator.instance = new GlobalMediator()
    }
    return GlobalMediator.instance
  }

  subscribe<K extends AllEvents>(eventName: K, callback: (data: EventsMap[K]) => void): () => void {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = []
    }

    this.listeners[eventName]!.push(callback)

    if (this.messages[eventName] && this.messages[eventName]!.length > 0) {
      this.messages[eventName]!.forEach((message) => callback(message))
      delete this.messages[eventName]
    }

    return () => {
      this.listeners[eventName] = this.listeners[eventName]!.filter(
        (listener) => listener !== callback
      )
    }
  }

  send<K extends AllEvents>(eventName: K, data: EventsMap[K]): void {
    if (this.listeners[eventName]) {
      this.listeners[eventName]!.forEach((callback) => callback(data))
    } else {
      if (!this.messages[eventName]) {
        this.messages[eventName] = []
      }
      this.messages[eventName]!.push(data)
    }
  }
}
