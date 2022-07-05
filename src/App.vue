<script setup lang="ts">
import '@unocss/reset/tailwind.css'
import './styles/main.css'
import 'uno.css'
import { fs, utoa } from "@/fs"
import type { File, VueSFCFile, CompileFile } from "@/integrations/vfs"
import { Sandbox, SandboxHandleData, SandboxExpose } from "@/components/iframe"
import { MonacoEditor, MonacoEditorExpose } from "@/components/monaco"
import { Packages, PackagesManager } from "@/components/packages"

const sandbox = ref<SandboxExpose>()
const monaco = ref<MonacoEditorExpose>()
const fileNames = ref(fs.dirs())
const active = ref<File>(fileNames.value[0])
const menuActive = ref('Preview')
const fileRE = /(\/file:\/\/)(.*)?\.(html|vuehtml|ts|js|json)/
const packageMeta = ref<Packages>(JSON.parse(fs.readFile('packages.json')!.content))

fs.subscribe('update', () => {
  packageMeta.value = JSON.parse(fs.readFile('packages.json')!.content) as Packages
  fileNames.value = fs.dirs()
})

fs.subscribe('delete', () => {
  fileNames.value = fs.dirs()
})
onMounted(async () => {
  const monacoManager = await monaco.value!.manager.promise
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
  // monaco editor change content
  monacoManager.onDidChangeContent((e, model) => {
    const [_, __, filename, suffix] = fileRE.exec(model.uri.path)!
    const content = model.getValue()
    // write to virtual file system
    if (filename.endsWith('.vue')) {
      const file = fs.readFile(filename) as VueSFCFile
      if (suffix === 'vuehtml') {
        file.template = content
      } else {
        file.script = content
      }
    } else {
      const file = fs.readFile(filename + '.' + suffix)!
      file.content = content
      fs.writeFile(file)
    }
  })
  bootstrap()
})

async function loadModules(data: SandboxHandleData): Promise<string> {
  const [id, _] = data.id!.split('?')
  console.log('[resolveId]', id)
  if (id.startsWith('./')) {
    const filename = id.replace('./', '')
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
  throw 'can not load the file: ' + data.id!
}

async function resolveId(data: SandboxHandleData): Promise<string> {
  console.log('[resolveId]', data.id)
  if (data.id?.startsWith('./')) {
    return data.id! + '?t=' + Date.now()
  }
  const dep = packageMeta.value.dependencies[data.id!]
  if (dep) {
    return dep.url.startsWith('/') ? location.origin + location.pathname + dep.url : dep.url
  }
  return data.id!
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
  console.log('[bootstrap]')
  const script = fs.readFile('bootstrap.js')!.content
  sandbox.value?.evalShim(script)
}

async function refreshMonacoEditor(file: File) {
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
}

function sharedPlayground() {
  const names = fs.all().reduce((acc, file) => {
      acc[file.filename] = file.toString()
      return acc
  }, {} as Record<string, string>)
  location.hash = utoa(JSON.stringify(names))
}

</script>
<template>
<div class="wrap" flex flex-col h-full overflow-hidden>
  <ul flex justify-start items-center shadow-lg cursor-default>
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
        <ic:round-close v-if="active.filename === item.filename" @click="close(item.filename)" cursor-pointer />
      </p>
    </li>
  </ul>
  <div w-full h-full flex text-light>
    <div class="menu" w-10 flex justify-start flex-col items-center flex-gap-2>
      <gg:browser w-6 h-6 m-2 :class="menuActive === 'Preview' ? 'text-white' : 'text-gray'" @click="clickMenu('Preview')"/>
      <ri:install-line w-6 h-6 m-2 :class="menuActive === 'Installed' ? 'text-white' : 'text-gray'" @click="clickMenu('Installed')"/>
      <mdi:package-variant-closed w-6 h-6 m-2 :class="menuActive === 'Packages' ? 'text-white' : 'text-gray'" @click="clickMenu('Packages')"/>
      <ic:round-bolt w-6 h-6 m-2 @click="bootstrap" />
      <ic:sharp-share w-6 h-6 m-2 @click="sharedPlayground"/>
    </div>
    <div class="edit-wrap" flex-1>
      <MonacoEditor ref="monaco" />
    </div>
    <div w="1/2" h-full>
      <Sandbox
        v-show="menuActive === 'Preview'"
        ref="sandbox"
        :load-modules="loadModules"
        :resolve-id="resolveId"
      >
      </Sandbox>
      <PackagesManager v-if="['Installed', 'Packages'].includes(menuActive)" :active="menuActive" @update="refreshMonacoEditor"></PackagesManager>
    </div>
  </div>
</div>
</template>
