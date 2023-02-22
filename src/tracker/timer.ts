import type { Maybe } from 'src/types'
import { EventEmitter } from 'typed-event-emitter'

export class Timer extends EventEmitter {
  private static instance: Maybe<Timer>

  onTick = this.registerEvent()
  readonly intervalId: number

  private constructor() {
    super()
    this.intervalId = window.setInterval(() => this.emit(this.onTick), 1000)
  }

  static new() {
    if (Timer.instance) return Timer.instance
    else return (Timer.instance = new Timer())
  }

  static clean() {
    if (this.instance) this.instance.removeListener()
    this.instance = null
  }
}
