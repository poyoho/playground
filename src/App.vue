<script setup lang="ts">
import { Sandbox, SandboxHandleData, SandboxExpose } from "@/components/iframe"
import { MonacoEditor, MonacoEditorExpose } from "@/components/monaco"
import { TabsWrap, TabItem, Tabs } from "@/components/tabs/tabs"
import { fs, File, VueSFCFile, CompileFile } from "@/integrations/vfs"
import PackagesManager from "@/components/packages/packges.vue"

const sandbox = ref<SandboxExpose>()
const monaco = ref<MonacoEditorExpose>()
const fileNames = ref(fs.dirs())
const active = ref<File>(fileNames.value[0])
const menuActive = ref('')

fs.subscribe('update', () => {
  fileNames.value = fs.dirs()
})

fs.subscribe('delete', () => {
  fileNames.value = fs.dirs()
})
onMounted(async () => {
  const monacoManager = await monaco.value!.manager.promise
  const sandboxInstance = sandbox.value!
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
    sandboxInstance.evalShim(bootstrap())
  }, { immediate: true })
})

async function loadModules(data: SandboxHandleData): Promise<string> {
  if (data.id?.startsWith('./')) {
    const filename = data.id.replace('./', '')
    const file = fs.readFile(filename)
    if (!file) {
      throw 'no found file'
    }

    // absolute path (internal module)
    if ((file as any).compileFile) {
      const compileFile = file as CompileFile
      if (file.change) {
        await compileFile.compileFile()
      }
      return compileFile.compiled.js
    }
  }
  // module path (extract module)
  console.log('[loadModules]', data.id)
  const res = await fetch('/vue.runtime.esm-browser.prod.js')
  return await res.text()
}

function close(file: string) {
  fs.removeFile(file)
}

function clickMenu(menu: string) {
  const configFile = fs.readFile('packages.json')!
  configFile.private = false
  fileNames.value = fs.dirs()
  active.value = configFile
  menuActive.value = menu
}

function bootstrap() {
  return fs.readFile('bootstrap.js')!.content
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
  <div w-full h-full flex text-light>
    <div class="menu" w-10 flex justify-start flex-col items-center flex-gap-2>
      <ri:install-line w-6 h-6 m-2 cursor-pointer @click="clickMenu('installed')"/>
      <mdi:package-variant-closed w-6 h-6 m-2 cursor-pointer @click="clickMenu('packages')"/>
    </div>
    
    <div class="edit-wrap" w="1/2">
      <MonacoEditor ref="monaco" />
    </div>
    <div w="1/2" h-full>
      <PackagesManager v-if="active.filename === 'packages.json'"/>
      <Sandbox ref="sandbox" :load-modules="loadModules"></Sandbox>
    </div>
  </div>
</div>
</template>
