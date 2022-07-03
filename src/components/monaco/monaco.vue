<script lang="ts" setup>
import { createMonacoManager } from "@/integrations/monaco"

const editor = ref<HTMLElement>()

onMounted(async () => {
  const manager = await createMonacoManager(editor.value!, ['vuehtml', 'ts'])
  manager.active(['vuehtml', 'ts'])
})

</script>
<template>
  <div ref="editor" w-full h-full></div>
</template>
