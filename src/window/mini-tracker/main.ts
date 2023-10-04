import MiniTrackerWindow from './MiniTrackerWindow.svelte'
import 'virtual:uno.css'
import '@unocss/reset/eric-meyer.css'

const window = new MiniTrackerWindow({
  target: document.body,
})

export default window
