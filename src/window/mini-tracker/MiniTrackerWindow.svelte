<script lang="ts">
  import ProgressCircle from './ProgressCircle.svelte'

  const ipcRenderer = require('electron').ipcRenderer
  // ipcRenderer.on('foo', (...args) => {
  // })
</script>

<div class="w-full h-full grid place-content-center" style="-webkit-app-region: drag">
  <div class="flex items-center space-x-3">
    <div>
      <ProgressCircle
        progress={40}
        backgroundSize={34}
        overlaySize={30}
        --overlay-color="white"
        --bg-color="#8770EB"
      />
    </div>
    <div class="w-full h-full">
      <div class="text-gray-900">Coding</div>
      <div class="text-xs text-gray-400">Next: SuperMemo</div>
    </div>
  </div>
</div>

<style windi:preflights:global windi:safelist:global>
</style>
