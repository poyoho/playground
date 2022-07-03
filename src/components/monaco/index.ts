import MonacoEditor from "./monaco.vue"
import type { MonacoManager } from "@/integrations/monaco"
export {
  MonacoEditor,
  MonacoManager
}

export interface MonacoEditorExpose {
  manager: { promise: Promise<MonacoManager> }
}
