<script lang="ts">
	import { tooltipAction } from "./actions";

	export let leftMins = 0;
</script>

<div class="progress-bar-wrapper">
	<div class="progress-bar-container">
		<div class="progress" />
		<div class="tooltip-container" use:tooltipAction={leftMins} />
		<style>
			.tooltip-container > button {
				width: 100%;
				opacity: 0;
			}
		</style>
	</div>
</div>

<style>
	.progress-bar-wrapper {
		position: relative;
		height: 100%;
		width: var(--size-4-16);
		margin: 0 var(--size-4-2);
		display: grid;
		place-items: center;
	}

	.progress-bar-container {
		position: absolute;
		border-radius: var(--size-4-1);
		width: var(--size-4-16);
		height: var(--size-4-4);
		background: hsla(var(--color-accent-hsl), 0.3);
		overflow: hidden;
	}

	.progress {
		position: absolute;
		border-radius: var(--size-4-1);
		left: 0;
		height: 100%;
		width: var(--progress-value);
		background: var(--color-accent);
	}

	.tooltip-container {
		width: 100%;
	}
</style>
