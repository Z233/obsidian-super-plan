<script lang="ts">
	import type { Activity, Maybe } from "src/types";
	import { parseMins2Time } from "src/utils/helper";
	import ProgressBar from "./ProgressBar.svelte";

	export let now: Maybe<Activity>;
	export let next: Maybe<Activity>;
	export let progress = 0;
	export let leftMins = 0;
</script>

<div class="container">
	{#if now}
		<strong>Now</strong>
		<span>{parseMins2Time(now.start)}</span>
		<span>{now.activity}</span>
		<ProgressBar {leftMins} --progress-value={`${progress}%`} />

		{#if next}
			<strong>Next</strong>
			<span>{parseMins2Time(next.start)}</span>
			<span>{next.activity}</span>
		{/if}
	{:else}
		<span>No Activity</span>
	{/if}
</div>

<style>
	.container {
		display: flex;
		align-items: center;
	}

	.container > * + * {
		margin-left: var(--size-4-1);
	}
</style>
