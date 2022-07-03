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

  createModel(
    extension: keyof typeof SupportLanguage,
    filename: string,
    code?: string
  ): monaco.editor.ITextModel {
    return monaco.editor.createModel(
      code || "",
      SupportLanguage[extension],
      monaco.Uri.file(`file://${filename}`)
    )
  }

  findModel(filename: string) {
    return monaco.editor.getModel(monaco.Uri.file(`file://${filename}`))
  }

  setModel(model: monaco.editor.ITextModel) {
    console.log("[monaco-editor] setModel")
    this.monacoEditor.setModel(model)
  }

  removeModel() {
    this.monacoEditor.getModel()?.dispose()
  }
}

export const createMonacoManager = createSinglePromise(async (wrap: HTMLElement, allTypes: SupportEditorType[]) => {
  const editors: Record<string, MonacoEditorItem> = {}
  const [_, theme] = await Promise.all([
    loadWorkers(),
    createMonacoThemeManager(),
  ])
  wrap.style.cssText = `
    display: flex;
    flex-direction: column
  `
  allTypes.forEach(type => {
    const el = document.createElement('div')
    const editor = new MonacoEditor(el)
    const state = { el, editor, status: true }
    editors[type] = state
    state.status = true
    theme.setupTheme(editor.monacoEditor, 'vscode-drak')
  })

  function get(type: SupportEditorType): MonacoEditorItem {
    return editors[type]
  }

  function hide(types: SupportEditorType[]): MonacoEditorItem[] {
    return types.map(type => {
      const state = editors[type]
      state.el.remove()
      return state
    })
  }

  function active(types: SupportEditorType[]) {
    hide(allTypes)
    const height = 100 / types.length
    return types.map(type => {
      const state = editors[type]
      state.el.style.height = `${height}%`
      wrap.appendChild(state.el)
      return state
    })
  }

  return {
    monaco,
    theme,
    typescript: createMonacoTypescriptServiceManage(),
    get,
    active
  }
})
