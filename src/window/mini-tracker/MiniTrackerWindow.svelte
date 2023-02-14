<script lang="ts">
  import type { TrackerState } from 'src/tracker/plan-tracker'
  import type { Activity, Maybe } from 'src/types'
  import ProgressCircle from './ProgressCircle.svelte'

  let now: Maybe<Activity> = null
  let next: Maybe<Activity> = null
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
      <ProgressCircle
        {progress}
        backgroundSize={34}
        overlaySize={30}
        --overlay-color="white"
        --bg-color="#8770EB"
      />
    </div>
    <div class="col-span-3">
      <div class="text-gray-900 truncate">{now?.activity ?? 'No activity'}</div>
      <div class="text-xs text-gray-400 truncate">{next ? `Next: ${next.activity}` : 'All done'}</div>
    </div>
  </div>
</div>

<style windi:preflights:global windi:safelist:global>
</style>
