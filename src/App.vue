<script setup lang="ts">
import { Sandbox, SandboxHandleData, SandboxExpose } from "@/components/iframe"
import { MonacoEditor, MonacoEditorExpose } from "@/components/monaco"
import { fs, File, VueSFCFile, CompileFile } from "@/integrations/vfs"
import { PackagesManager } from "@/components/packages"

const sandbox = ref<SandboxExpose>()
const monaco = ref<MonacoEditorExpose>()
const fileNames = ref(fs.dirs())
const active = ref<File>(fileNames.value[0])
const menuActive = ref('Preview')

fs.subscribe('update', async (file) => {
  fileNames.value = fs.dirs()
  if (!monaco.value) {
    return
  }
  const monacoManager = await monaco.value.manager.promise
  const editors = monacoManager.getActiveEditor()
  if (!editors) {
    return
  }
  if (file.suffix === 'vue') {
    const [editor1, editor2] = editors
    editor1.editor.monacoEditor.setValue((file as VueSFCFile).template)
    editor2.editor.monacoEditor.setValue((file as VueSFCFile).script)
  } else {
    const [editor1] = editors
    editor1.editor.monacoEditor.setValue(file.toString())
  }
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
  menuActive.value = menu
  switch(menu) {
    case 'Installed':
    case 'Packages':
      const configFile = fs.readFile('packages.json')!
      configFile.private = false
      fileNames.value = fs.dirs()
      active.value = configFile
      break
    case 'Preview':
      break
  }
}


function bootstrap() {
  return fs.readFile('bootstrap.js')!.content
}
</script>
<template>
<div class="wrap" flex flex-col h-full overflow-hidden>
  <ul flex justify-start items-center shadow-lg>
    <li
      bg-dark-1 text-light  h-full p-2 px-3 text-3
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
    </li>
  </ul>
  <div w-full h-full flex text-light>
    <div class="menu" w-10 flex justify-start flex-col items-center flex-gap-2>
      <gg:browser w-6 h-6 m-2  :class="menuActive === 'Preview' ? 'text-white' : 'text-gray'" @click="clickMenu('Preview')"/>
      <ri:install-line w-6 h-6 m-2  :class="menuActive === 'Installed' ? 'text-white' : 'text-gray'" @click="clickMenu('Installed')"/>
      <mdi:package-variant-closed w-6 h-6 m-2  :class="menuActive === 'Packages' ? 'text-white' : 'text-gray'" @click="clickMenu('Packages')"/>
    </div>
    <div class="edit-wrap" flex-1>
      <MonacoEditor ref="monaco" />
    </div>
    <div w="1/2" h-full>
      <Sandbox v-show="menuActive === 'Preview'" ref="sandbox" :load-modules="loadModules"></Sandbox>
      <PackagesManager v-if="['Installed', 'Packages'].includes(menuActive)" :active="menuActive"></PackagesManager>
    </div>
  </div>
</div>
</template>
