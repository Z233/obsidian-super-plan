<script lang="ts">
  import type { TrackerState } from 'src/tracker/plan-tracker'
  import type { ScheduledActivity, Maybe } from 'src/types'
  import MiniClock from './MiniClock.svelte'

  let now: Maybe<ScheduledActivity> = null
  let next: Maybe<ScheduledActivity> = null
  let progress = 0

  const ipcRenderer = require('electron').ipcRenderer
  ipcRenderer.on('update', (e, payload: TrackerState) => {
    if (!payload) return
    const { ongoing, upcoming } = payload

    if (ongoing) {
      now = ongoing.activity
      progress = ongoing.progress
    }

    if (upcoming) {
      next = upcoming.activity
    }
  })
</script>

<div class="w-full h-full grid place-content-center" style="-webkit-app-region: drag">
  <div class="grid items-center space-x-3 grid-cols-4 px-4">
    <div class="col-span-1">
      <MiniClock {progress} size={36} />
    </div>
    <div class="col-span-3">
      <div class="text-gray-900 truncate">{now?.activity ?? 'No activity'}</div>
      <div class="text-xs text-gray-400 truncate">
        {next ? `Next: ${next.activity}` : 'All done'}
      </div>
    </div>
  </div>
</div>

<style windi:preflights:global windi:safelist:global>
</style>
