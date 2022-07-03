<script lang="ts" setup>
import { createMonacoManager, MonacoManager } from "@/integrations/monaco"
import { createDefer } from "@/utils/promise"

const editor = ref<HTMLElement>()
const manager = createDefer<MonacoManager>()

onMounted(async () => {
  const monacoManager = await createMonacoManager(editor.value!, 2)
  manager.resolve(monacoManager)
})

defineExpose({
  manager
})
</script>
<template>
  <div ref="editor" w-full h-full></div>
</template>
