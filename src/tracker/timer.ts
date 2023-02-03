import { EventEmitter } from 'typed-event-emitter'

class Timer extends EventEmitter {
  onTick = this.registerEvent()
  readonly intervalId: number

  constructor() {
    super()
    this.intervalId = window.setInterval(() => this.emit(this.onTick), 1000)
  }
}

export const timer = new Timer()
