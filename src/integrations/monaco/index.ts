import { createSinglePromise, tryPromise } from "@/utils/promise"

export * from "./textmate"
import { useMonacoEditorMain } from "./fillers/monaco"
import { setupTypescriptLanguageService } from "./setup"

export const SupportLanguage = {
  "vuehtml": "vuehtml",
  "html": "html",
  "js": "javascript",
  "ts": "typescript",
  "css": "css",
  "json": "json"
}

export const loadWorkers = createSinglePromise(async () => {
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
})

export const setupMonaco = createSinglePromise(async () => {
  const { monaco } = await useMonacoEditorMain()

  await loadWorkers()

  return {
    monaco,
    typescript: setupTypescriptLanguageService(monaco),
  }
})

export async function getRunnableJS (filename: string) {
  const { monaco } = await setupMonaco()
  const uri = monaco.Uri.file(`file://${filename}`)
  // sometimes typescript worker is not loaded
  const worker = await tryPromise(() => monaco.languages.typescript.getTypeScriptWorker(), 3, 100)
  const client = await worker(uri)
  const result = await client.getEmitOutput(uri.toString())
  const firstJS = result.outputFiles.find((o: any) => o.name.endsWith(".js"))
  return (firstJS && firstJS.text) || ""
}

export default setupMonaco
