<script lang="ts">
  import { Menu } from 'obsidian'
  import { NO_ACTIVITY_NAME_PLACEHOLDER, ProgressType } from 'src/constants'
  import type { ScheduledActivity, Maybe } from 'src/types'
  import { parseMins2Time } from 'src/util/helper'
  import ProgressBar from './ProgressBar.svelte'
  import ProgressCircle from './ProgressCircle.svelte'

  export let jump2ActivityRow: (activity: ScheduledActivity) => void = () => {}
  export let beginActivity: (activity: ScheduledActivity) => void = () => {}

  export let now: Maybe<ScheduledActivity>
  export let next: Maybe<ScheduledActivity>
  export let progress = 0
  export let leftMins = 0
  export let isAllDone = false

  export let progressType: ProgressType = ProgressType.BAR

  const formatActivityName = (name: string) =>
    name.trim().length > 0 ? name : NO_ACTIVITY_NAME_PLACEHOLDER

  function handleContextMenu(e: MouseEvent, act: ScheduledActivity) {
    const menu = new Menu()
    menu.addItem((item) =>
      item
        .setTitle('Begin activity')
        .setIcon('chevron-last')
        .onClick(() => beginActivity(act))
    )
    menu.showAtMouseEvent(e)
  }
</script>

<div class="container">
  {#if now}
    <div
      on:click={() => now && jump2ActivityRow(now)}
      on:keydown={(e) => e.key === 'Space' && now && jump2ActivityRow(now)}
      class="now clickable"
    >
      <strong>Now</strong>
      <span>{parseMins2Time(now.start)}</span>
      <span>{formatActivityName(now.activity)}</span>
    </div>

    {#if !isAllDone}
      {#if progressType === ProgressType.BAR}
        <ProgressBar {leftMins} --progress-value={`${progress}%`} />
      {:else if progressType === ProgressType.CIRCLE}
        <ProgressCircle {leftMins} {progress} />
      {/if}
    {/if}

    {#if next}
      <div
        on:click={() => next && jump2ActivityRow(next)}
        on:contextmenu={(e) => next && handleContextMenu(e, next)}
        on:keydown={(e) => e.key === 'Space' && next && jump2ActivityRow(next)}
        class="next clickable"
      >
        <strong>Next</strong>
        <span>{parseMins2Time(next.start)}</span>
        <span>{formatActivityName(next.activity)}</span>
      </div>
    {/if}
  {:else if !isAllDone}
    <span>No Activity</span>
  {/if}
</div>

<style>
  .container {
    display: flex;
    align-items: center;
    height: 100%;
  }

  .now > * ~ *,
  .next > * ~ * {
    margin-left: var(--size-2-1);
  }

  .clickable {
    position: relative;
  }

  .clickable:hover::after {
    visibility: visible;
  }

  .clickable::after {
    visibility: hidden;
    content: '';
    position: absolute;
    inset: -3px -4px;
    background-color: var(--background-modifier-hover);
    z-index: 999;
    border-radius: var(--radius-s);
  }
</style>
