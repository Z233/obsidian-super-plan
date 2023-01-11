<script lang="ts">
	import { ProgressType } from "src/constants";
	import type { Activity, Maybe } from "src/types";
	import { parseMins2Time } from "src/utils/helper";
	import ProgressBar from "./ProgressBar.svelte";
	import ProgressCircle from "./ProgressCircle.svelte";

	export let now: Maybe<Activity>;
	export let next: Maybe<Activity>;
	export let progress = 0;
	export let leftMins = 0;
	export let isAllDone = false;

	export let progressType: ProgressType = ProgressType.BAR;
</script>

<div class="container">
	{#if now}
		<strong>Now</strong>
		<span>{parseMins2Time(now.start)}</span>
		<span>{now.activity}</span>

		{#if progressType === ProgressType.BAR}
			<ProgressBar {leftMins} --progress-value={`${progress}%`} />
		{:else if progressType === ProgressType.CIRCLE}
			<ProgressCircle {leftMins} {progress} />
		{/if}

		{#if next}
			<strong>Next</strong>
			<span>{parseMins2Time(next.start)}</span>
			<span>{next.activity}</span>
		{/if}
	{:else if !isAllDone}
		<span>No Activity</span>
	{/if}

	{#if isAllDone}
		<span>All Done</span>
	{/if}
</div>

<style>
	.container {
		display: flex;
		align-items: center;
		height: 100%;
	}

	.container > * + * {
		margin-left: var(--size-4-1);
	}
</style>
