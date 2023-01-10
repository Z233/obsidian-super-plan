<script lang="ts">
	import { ButtonComponent } from "obsidian";
	import type { TooltipOptions } from "obsidian";
	import type { Maybe } from "src/types";
	import { onMount } from "svelte";

	export let leftMins = 0;

	const tooltipOptions: TooltipOptions = {
		placement: "top",
	};

	let tooltipEl: HTMLDivElement;
	let tooltipButtonComp: Maybe<ButtonComponent> = null;
	$: tooltipButtonComp?.setTooltip(`Left: ${leftMins} mins`, tooltipOptions);

	onMount(() => {
		tooltipButtonComp = new ButtonComponent(tooltipEl);
	});
</script>

<div class="progress-bar-container">
	<div class="progress" />
	<div class="tooltip-container" bind:this={tooltipEl} />
	<style>
		.tooltip-container > button {
			width: 100%;
			opacity: 0;
		}
	</style>
</div>

<style>
	.progress-bar-container {
		position: relative;
		border-radius: var(--size-4-1);
		width: var(--size-4-16);
		height: var(--size-4-4);
		background: #d3caf7;
		margin: 0 var(--size-4-2);
		overflow: hidden;
	}

	.progress {
		position: absolute;
		border-radius: var(--size-4-1);
		left: 0;
		height: 100%;
		width: var(--progress-value);
		background: var(--color-purple);
	}

	.tooltip-container {
		width: 100%;
	}
</style>
