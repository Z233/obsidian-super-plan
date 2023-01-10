<script lang="ts">
	import { DEFAULT_CIRCLE_PROGRESS_SIZE } from "src/constants";
	import { tooltipAction } from "./actions";

	export let leftMins = 0;
	export let progress = 0;

	const size = DEFAULT_CIRCLE_PROGRESS_SIZE;

	const dashArray = 2 * Math.PI * (size / 4);
	const dashOffset = dashArray - (dashArray * progress) / 100;
</script>

<div
	class="progress-circle-wrapper"
	style={`--circle-progress-size: ${size}px`}
>
	<div class="progress-circle-container">
		<svg
			width={size}
			height={size}
			xmlns="http://www.w3.org/2000/svg"
			viewBox={`0 0 ${size} ${size}`}
			style="transform: rotate(calc(-90deg))"
		>
			<circle
				fill="hsla(var(--color-accent-hsl), 0.3)"
				cx="50%"
				cy="50%"
				r={size / 2}
			/>
			<circle
				class="progress-circle-overlay"
				fill="transparent"
				stroke="var(--color-accent)"
				cx="50%"
				cy="50%"
				r={size / 4}
				stroke-width={size / 2}
				stroke-dasharray={dashArray}
				stroke-dashoffset={dashOffset}
			/>
		</svg>
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
	.progress-circle-wrapper {
		position: relative;
		height: 100%;
		width: var(--circle-progress-size);
		margin: 0 var(--size-4-2);
		display: grid;
		place-items: center;
	}

	.progress-circle-container {
		position: absolute;
		display: grid;
		place-items: center;
	}

	.progress-circle-overlay {
		transition: stroke-dashoffset 1s linear;
	}

	.tooltip-container {
		position: absolute;
		inset: 0;
	}
</style>
