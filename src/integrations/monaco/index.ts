import * as monaco from "monaco-editor"
import { createMonacoThemeManager } from "./textmate"
import { createMonacoTypescriptServiceManage } from "./language/typescript"
import { createSinglePromise, tryPromise } from "@/utils/promise"

export type SupportEditorType = "vuehtml" | "ts" | "js" | "css" | "json" | "html"

export interface MonacoEditorItem {
  el: HTMLElement
  editor: MonacoEditor
  status: boolean
}

type PromiseValue<T> = T extends Promise<infer N> ? N : never

export type MonacoManager = PromiseValue<ReturnType<typeof createMonacoManager>>

export const SupportLanguage = {
  "vuehtml": "vuehtml",
  "html": "html",
  "js": "javascript",
  "ts": "typescript",
  "css": "css",
  "json": "json"
}

async function loadWorkers() {
  const [
    _, // just import it
    { default: VueHTMLWorker },
    { default: EditorWorker },
    { default: JSONWorker },
    { default: TsWorker },
    { default: CSSWorker },
    { default: HTMLWorker },
  ] = await Promise.all([
    import("./language/vuehtml/monaco.contribution"),
    import('./language/vuehtml/vuehtml.worker.ts?worker'),
    import('monaco-editor/esm/vs/editor/editor.worker?worker'),
    import('monaco-editor/esm/vs/language/json/json.worker?worker'),
    import('monaco-editor/esm/vs/language/typescript/ts.worker?worker'),
    import('monaco-editor/esm/vs/language/css/css.worker?worker'),
    import('monaco-editor/esm/vs/language/html/html.worker?worker'),
  ])

  // monaco need worker object mount in window
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  window.MonacoEnvironment = {
    getWorker(_: any, label: string) {
      console.log("[load worker]", label)
      switch(label) {
        case 'json':
          return new JSONWorker()
        case 'vuehtml':
          return new VueHTMLWorker()
        case 'html':
          return new HTMLWorker()
        case 'typescript':
        case 'javascript':
          return new TsWorker()
        case 'css':
          return new CSSWorker()
        default:
          return new EditorWorker()
      }
    },
  }
}

function createModel(
  extension: SupportEditorType,
  filename: string,
  code?: string
): monaco.editor.ITextModel {
  return monaco.editor.createModel(
    code || "",
    SupportLanguage[extension],
    monaco.Uri.file(`file://${filename}`)
  )
}

function findModel(filename: string) {
  return monaco.editor.getModel(monaco.Uri.file(`file://${filename}`))
}

export async function getRunnableJS(filename: string) {
  const uri = monaco.Uri.file(`file://${filename}`)
  // sometimes typescript worker is not loaded
  const worker = await tryPromise(() => monaco.languages.typescript.getTypeScriptWorker(), 3, 100)
  const client = await worker(uri)
  const result = await client.getEmitOutput(uri.toString())
  const firstJS = result.outputFiles.find((o: any) => o.name.endsWith(".js"))
  return (firstJS && firstJS.text) || ""
}

export class MonacoEditor {
  monacoEditor: monaco.editor.ICodeEditor

  constructor(el: HTMLElement) {
    this.monacoEditor = monaco.editor.create(el, {
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
  }

  setModel(model: monaco.editor.ITextModel) {
    console.log("[monaco-editor] setModel")
    this.monacoEditor.setModel(model)
  }

  removeModel() {
    this.monacoEditor.getModel()?.onDidChangeContent
    this.monacoEditor.getModel()?.dispose()
  }
}

export const createMonacoManager = createSinglePromise(async (wrap: HTMLElement, length: number) => {
  const editors: MonacoEditorItem[] = []
  const [_, theme] = await Promise.all([
    loadWorkers(),
    createMonacoThemeManager(),
  ])
  wrap.style.cssText = `
    display: flex;
    flex-direction: column
  `
  for(let i = 0; i < length; i++) {
    const editorWrap = document.createElement('div')
    editorWrap.style.width = "100%"
    editorWrap.style.height = "100%"
    const editor = new MonacoEditor(editorWrap)

    const el = document.createElement("div")
    el.style.width = "100%"
    el.style.height = "100%"
    el.appendChild(editorWrap)

    const state = { el, editor, status: true }
    editors.push(state)
    theme.setupTheme(editor.monacoEditor, 'vscode-drak')
    wrap.appendChild(state.el)
  }
  active(length)

  function createModelIfNotExist(
    extension: SupportEditorType,
    filename: string,
    code?: string
  ) {
    const model = findModel(filename)
    if (!model) {
      return createModel(extension, filename, code)
    }
    return model
  }

  function hideAll(): MonacoEditorItem[] {
    return editors.map(state => {
      state.status = false
      state.el.style.display = "none"
      state.el.style.height = "0%"
      return state
    })
  }

  function active(num: number) {
    hideAll()
    const height = 100 / num
    return Array(num).fill(1).map((_, i) => {
      const state = editors[i]
      state.status = true
      state.el.style.display = "block"
      state.el.style.height = `${height}%`
      return state
    })
  }

  function getActiveEditor() {
    return editors.filter(state => state.status)
  }

  return {
    monaco,
    theme,
    typescript: createMonacoTypescriptServiceManage(),
    active,
    getActiveEditor,
    createModelIfNotExist
  }
})
