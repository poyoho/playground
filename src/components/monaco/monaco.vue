<script setup lang="ts">
import { setupMonaco, setupTheme, SupportLanguage } from "@/integrations/monaco"
import { createDefer } from "@/utils/promise"
import { debounce } from "@/utils/debounce"

export type MonacoEditorChangeEvent = Event & {
  value: {
    content: string
  }
}

const editor = ref<HTMLDivElement>()
const monacoAccessor = setupMonaco()
const monacoEditor = createDefer<monaco.editor.IStandaloneCodeEditor>()
const emit = defineEmits([
  'change'
])
onMounted(async () => {
  const { monaco } = await monacoAccessor
  const editorInstance = monaco.editor.create(editor.value!, {
    tabSize: 2,
    insertSpaces: true,
    autoClosingQuotes: 'always',
    detectIndentation: false,
    folding: false,
    automaticLayout: true,
    theme: 'vscode-dark',
    minimap: {
      enabled: false,
    },
    useShadowDOM: false,
  })
  // send change event
  editorInstance.onDidChangeModel(() => {
    const model = editorInstance.getModel()
    if (!model) {
      return
    }
    console.log("[monaco-editor] change model")
    model.onDidChangeContent(debounce(() => {
      emit('change', {
        content: editorInstance.getValue()
      })
    }))
  })
  monacoEditor.resolve(editorInstance)
  await setupTheme(monaco, editorInstance)
  monaco.editor.setTheme("vscode-dark")
})

defineExpose({
  async createModel(
    extension: keyof typeof SupportLanguage,
    filename: string,
    code?: string
  ) {
    console.log("[monaco-editor] createModel")
    const { monaco } = await monacoAccessor
    return monaco.editor.createModel(
      code || "",
      SupportLanguage[extension],
      monaco.Uri.file(`file://${filename}`)
    )
  },

  setModel(model: monaco.editor.ITextModel) {
    console.log("[monaco-editor] setModel")
    monacoEditor.promise.then(editor => {
      editor.setModel(model)
    })
  },

  async findModel(filename: string) {
    const { monaco } = await monacoAccessor
    return monaco.editor.getModel(monaco.Uri.file(`file://${filename}`))
  },

  removeModel() {
    monacoEditor.promise.then(editor => {
      editor.getModel()?.dispose()
    })
  }
})
</script>
<template>
  <div
    ref="editor"
    w-full h-full
  >
  </div>
</template>
