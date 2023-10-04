<script lang="ts">
  import type { TrackerState } from 'src/tracker/plan-tracker'
  import type { ScheduledActivity, Maybe } from 'src/types'
  import MiniClock from './MiniClock.svelte'
  import { onMount } from 'svelte'
  
  let now: Maybe<ScheduledActivity> = null
  let next: Maybe<ScheduledActivity> = null
  let progress = 0
  let leftMins = 0
  let timeoutMins = 0
  
  let estimatedLeftMins = 0
  $: {
    if (now) {
      estimatedLeftMins = leftMins - (leftMins % 5) 
      estimatedLeftMins = estimatedLeftMins >= 0 ? estimatedLeftMins : 5
    }
  }
  
  const ipcRenderer = require('electron').ipcRenderer
  ipcRenderer.on('update', (e, payload: TrackerState) => {
    if (!payload) return
    const { ongoing, upcoming } = payload

    if (ongoing) {
      now = ongoing.activity
      progress = ongoing.progress
      leftMins = ongoing.leftMins
      timeoutMins = -leftMins
    }
    
    if (upcoming) {
      next = upcoming.activity
    }
  })
  

  let snapped: 'l' | 'r' | null = null
  let isViewingSnapped = false
  
  const onSnappedViewStart = () => {
    requestAnimationFrame(() => {
      isViewingSnapped = true
    })
    ipcRenderer.send('snapped-view-start')
  } 
  
  const onSnappedViewEnd = () => {
    isViewingSnapped = false
    ipcRenderer.send('snapped-view-end')
  }

  
  $: {
    if (snapped) {
      document.addEventListener('mouseenter', onSnappedViewStart)
      document.addEventListener('mouseleave', onSnappedViewEnd)
    } else {
      document.removeEventListener('mouseenter', onSnappedViewStart)
      document.removeEventListener('mouseleave', onSnappedViewEnd)
    }
  }
  
  onMount(() => () => {
    document.removeEventListener('mouseenter', onSnappedViewStart)
    document.removeEventListener('mouseleave', onSnappedViewEnd)
  })

  ipcRenderer.on('snapped', (e, direction) => {
    if (direction) {
      snapped = direction
    }
  }) 

  const handleSnapStop = () => {
    snapped = null
    ipcRenderer.send('snapped-stop')
  } 
</script>

<div 
  class="w-full h-full grid place-content-center relative select-none"
  style:-webkit-app-region={snapped ? 'no-drag' : 'drag'}
>
  <div class="grid items-center space-x-3 grid-cols-4 px-4">
    <div class="col-span-1">
      <MiniClock {progress} size={36} />
    </div>
    <div class="col-span-3 space-y-1">
      <div class="text-gray-900 truncate">{now?.activity ?? 'No activity'}</div>
      <div class="text-xs text-gray-400 truncate">
        { timeoutMins < 0 ? `~${estimatedLeftMins}` : `+${timeoutMins}` } mins
        { next ? `> ${next.activity}` : ''}
      </div>
    </div>
  </div>
  
  {#if snapped !== null && isViewingSnapped}
    <div 
      on:click={handleSnapStop}
      on:keypress={ e => e.key === 'Enter' ? handleSnapStop() : void 0 }
      class="absolute h-full w-2.5 bg-gray-100 transition text-gray-400  grid place-content-center
        hover:bg-[hsla(254,80%,68%,1)] hover:text-gray-50 hover:shadow-md"
      class:right-0={snapped === 'l'}
      class:left-0={snapped === 'r'}
    >
      <svg class:rotate-180={snapped === 'r'} width="5" height="12" viewBox="0 0 5 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 1L3.96913 5.94855C3.98813 5.98022 3.98813 6.01978 3.96913 6.05145L1 11" stroke="currentColor" stroke-width="2" stroke-miterlimit="16" stroke-linecap="round"/>
      </svg>
    </div> 
  {/if}

  {#if snapped !== null && !isViewingSnapped}
    <div
      class="absolute h-full w-4 write-vertical-right text-xs place-content-center text-gray-800
        tracking-widest text-shadow flex justify-center items-center" 
      class:left-0={snapped === 'r'}
      class:right-0={snapped === 'l'}
      class:rotate-180={snapped === 'l'}
      class:animate-flash={progress >= 100}
      class:!animate-[flash_1.5s_linear_infinite]={progress >= 100}
    >
      {#if progress > 0}
        {Math.floor(progress)}<span class="mt-[.1rem]">%</span>
      {:else}
        <span class="text-[.6rem]">NONE</span>
      {/if}
    </div>
  {/if}
</div>