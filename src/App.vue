<script setup lang="ts">
import MonacoEditor from "@/components/monaco/monaco.vue"
import { Sandbox, SandboxHandleData } from "@/components/iframe"

const sandbox = ref()
onMounted(() => {
  sandbox.value!.evalShim(`
    import app from "./app"
    console.log(app)
  `)
})

function loadModules(data: SandboxHandleData) {
  if (data.id === './app') {
    return `
      export default "app.file"
    `
  }
  return ''
}

</script>

<template>
  <div w-full h-full flex>
    <div class="editor" w="1/2" h-full>
      <MonacoEditor></MonacoEditor>
    </div>
    <div class="info" w="1/2" h-full>
      <Sandbox ref="sandbox" :load-modules="loadModules"></Sandbox>
    </div>
  </div>
</template>
