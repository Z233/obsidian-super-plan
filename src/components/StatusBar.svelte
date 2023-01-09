<script lang="ts">
	import type { Activity, Maybe } from "src/types";
	import { parseMins2Time } from "src/utils/helper";

	export let now: Maybe<Activity>;
	export let next: Maybe<Activity>;
</script>

<div class="container">
	{#if now}
		<strong>Now</strong>
		<span>{parseMins2Time(now.start)}</span>
		<span>{now.activity}</span>
	{/if}
	<div class="progress-bar-container">
		<div class="progress" />
	</div>
	{#if next}
		<strong>Next</strong>
		<span>{parseMins2Time(next.start)}</span>
		<span>{next.activity}</span>
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

	.progress-bar-container {
		position: relative;
		border-radius: var(--size-2-1);
		width: var(--size-4-16);
		height: var(--size-4-3);
		background: #d3caf7;
	}

	.progress {
		position: absolute;
		left: 0;
		height: 100%;
		width: 40%;
		background: var(--color-purple);
	}
</style>
