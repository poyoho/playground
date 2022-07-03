<script setup lang="ts">
import { Sandbox, SandboxHandleData, SandboxExpose } from "@/components/iframe"
import { MonacoEditor, MonacoEditorExpose } from "@/components/monaco"
import { TabsWrap, TabItem, Tabs } from "@/components/tabs/tabs"
import { fs, File, VueSFCFile } from "@/integrations/vfs"

const sandbox = ref<SandboxExpose>()
const monaco = ref<MonacoEditorExpose>()
const fileNames = ref(fs.dirs())
const active = ref<File>(fileNames.value[0])

fs.subscribe('update', () => {
  fileNames.value = fs.dirs()
})

fs.subscribe('delete', () => {
  fileNames.value = fs.dirs()
})

onMounted(async () => {
  const monacoManager = await monaco.value!.manager.promise
  // const sandboxInstance = sandbox.value!
  watch(active, async () => {
    const { filename, suffix, content } = active.value
    if (active.value.suffix === 'vue') {
      const { template, script } = active.value as VueSFCFile
      const [editor1, editor2] = monacoManager.active(2)
      const model1 = monacoManager.createModelIfNotExist("vuehtml", filename + '.vuehtml', template)
      const model2 = monacoManager.createModelIfNotExist("ts", filename + '.ts', script)
      editor1.editor.setModel(model1)
      editor2.editor.setModel(model2)
    } else if (active.value.suffix === 'ts') {
      const [editor1] = monacoManager.active(1)
      const model1 = monacoManager.createModelIfNotExist(suffix as any, filename, content)
      editor1.editor.setModel(model1)
    } else {
      const [editor1] = monacoManager.active(1)
      const model1 = monacoManager.createModelIfNotExist(suffix as any, filename, content)
      editor1.editor.setModel(model1)
    }
  }, { immediate: true })
})

function loadModules(data: SandboxHandleData): string {
  return fs.readFile(data.id || '')?.toString() || ''
}

function close(file: string) {
  fs.removeFile(file)
}
</script>
<template>
<div class="wrap" flex flex-col h-full overflow-hidden>
  <TabsWrap shadow-lg>
    <Tabs flex justify-start items-center>
      <TabItem
        bg-dark-1 text-light cursor-pointer h-full p-2 px-3 text-3
        border-r-1 border-solid border-dark-400
        :class="active.filename === item.filename ? 'bg-dark-9' : ''"
        v-for="item in fileNames" :name="item.filename" :key="item.filename"
      >
        <p flex items-center justify-center flex-gap-2 @click="active = item">
          <logos-vue v-if="item.suffix === 'vue'" />
          <vscode-icons:file-type-light-json v-if="item.suffix === 'json'" />
          <logos-javascript v-if="item.suffix === 'js'" />
          <logos-typescript-icon v-if="item.suffix === 'ts'" />
          {{ item.filename }}
          <ic:round-close v-if="active.filename === item.filename" @click="close(item.filename)"/>
        </p>
      </TabItem>
    </Tabs>
  </TabsWrap>
  <div w-full h-full flex>
    <div class="menu" w-10>

    </div>
    <div class="edit-wrap" w="1/2">
      <MonacoEditor ref="monaco" />
    </div>
    <div w="1/2" h-full>
      <Sandbox ref="sandbox" :load-modules="loadModules"></Sandbox>
    </div>
  </div>
</div>
</template>
