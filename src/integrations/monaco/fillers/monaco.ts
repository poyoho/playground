import { createSinglePromise } from "@/utils/promise"
import * as monacoESM from "monaco-editor"

type monaco = typeof monaco

interface MonacoEditorImportData {
  monaco: monaco
}

export const useMonacoEditorMain = createSinglePromise<MonacoEditorImportData>(() => {
  if (typeof window !== 'undefined') {
    return Promise.resolve({
      monaco: monacoESM as unknown as monaco,
    })
  }

  throw "can not load moncao"
})
