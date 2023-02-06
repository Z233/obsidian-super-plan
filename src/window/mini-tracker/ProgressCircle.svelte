<script lang="ts">
  export let progress = 0

  export let backgroundSize: number
  export let overlaySize: number

  const dashArray = 2 * Math.PI * (overlaySize / 4)
  $: dashOffset = dashArray - (dashArray * progress) / 100
</script>

<div class="progress-circle-wrapper" style={`--circle-progress-size: ${backgroundSize}px`}>
  <div class="progress-circle-container">
    <svg
      width={backgroundSize}
      height={backgroundSize}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${backgroundSize} ${backgroundSize}`}
      style="transform: rotate(calc(-90deg))"
    >
      <circle fill="var(--bg-color)" cx="50%" cy="50%" r={backgroundSize / 2} />
      <circle
        class="progress-circle-overlay"
        fill="transparent"
        stroke="var(--overlay-color)"
        cx="50%"
        cy="50%"
        r={overlaySize / 4}
        stroke-width={overlaySize / 2}
        stroke-dasharray={dashArray}
        stroke-dashoffset={dashOffset}
      />
    </svg>
  </div>
</div>

<style>
  .progress-circle-wrapper {
    position: relative;
    height: var(--circle-progress-size);
    width: var(--circle-progress-size);
    margin: 0 var(--size-4-2);
    display: grid;
    place-items: center;
  }

  .progress-circle-overlay {
    transition: stroke-dashoffset 1s linear;
  }
</style>
