<script lang="ts">
  export let progress = 0
  export let size: number

  $: angle = (360 * progress) / 100
</script>

<div
  class="clock"
  style={`
    --clock-size: ${size}px;
    --hand-degrees: ${angle}deg;
  `}
>
  <div class="hand" />
  <div class="circle" />
</div>

<style>
  .clock {
    --hand-color: hsla(254, 80%, 50%, 1);

    position: relative;
    width: var(--clock-size);
    height: var(--clock-size);
    border-radius: 50%;
    margin: 0 auto;
    background: conic-gradient(
      hsla(254, 80%, 68%, 1) 0deg,
      hsla(254, 80%, 68%, 0.6) var(--hand-degrees),
      hsla(254, 80%, 68%, 0.2) 0deg
    );
    will-change: transform;
    transition: all 985ms linear;

    box-shadow: 0px 0px 2px rgba(0, 0, 0, 0.25);
  }

  .hand {
    position: absolute;
    left: 50%;
    bottom: 50%;
    height: 51%;
    width: 2px;
    margin-left: -1px;
    background: var(--hand-color);
    box-shadow: -2px 0px 4px rgba(0, 0, 0, 0.2);
    border-radius: 6px;
    transform-origin: bottom center;
    transition-timing-function: cubic-bezier(0.1, 2.7, 0.58, 1);
    transform: rotate(var(--hand-degrees));
    will-change: transform;
    transition: all 985ms linear;
  }

  .circle {
    position: absolute;
    width: 6px;
    height: 6px;
    background: white;
    left: 50%;
    bottom: 50%;
    transform: translate(-50%, 50%);
    border-radius: 50%;
    box-shadow: 0px 0px 4px rgba(0, 0, 0, 0.3), inset 0px 2px 0px #fff;
    background-image: -webkit-gradient(
      linear,
      left top,
      left bottom,
      color-stop(0%, hsl(0, 0, 96%)),
      color-stop(100%, hsl(0, 0, 100%))
    );
  }
</style>
