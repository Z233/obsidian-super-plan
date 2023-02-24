<script lang="ts">
  export let progress = 0

  export let backgroundSize: number
  export let overlaySize: number

  $: overlayAngle = (360 * progress) / 100
</script>

<div
  class="progress-circle-wrapper"
  style={`
    --circle-progress-size: ${backgroundSize}px;
    --circle-overlay-size: ${overlaySize}px;
  `}
>
  <div
    class="progress-circle-overlay"
    style={`--circle-overlay-degree: ${overlayAngle}deg;
  `}
  />
</div>

<style>
  .progress-circle-wrapper {
    position: relative;
    height: var(--circle-progress-size);
    width: var(--circle-progress-size);
    margin: 0 var(--size-4-2);
    display: grid;
    place-items: center;
    background: var(--circle-background-color);
    border-radius: 50%;
  }

  .progress-circle-overlay {
    height: var(--circle-overlay-size);
    width: var(--circle-overlay-size);
    border-radius: 50%;
    transition: background 1000ms linear;
    will-change: transform;
    background: conic-gradient(
        transparent 0deg var(--circle-overlay-degree),
        var(--circle-background-color) var(--circle-overlay-degree) 360deg
      ),
      conic-gradient(var(--circle-overlay-color) 0deg, var(--circle-overlay-color));
  }
</style>
