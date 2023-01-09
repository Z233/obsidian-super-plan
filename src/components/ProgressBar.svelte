<div class="progress-bar-container">
	<div class="progress" />
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
</style>
