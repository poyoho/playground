import { CompiledFile } from "@/integrations/vfs"
import { getRunnableJS } from "@/integrations/monaco"
import { compileVueSFCFile } from "./vue"

export async function compileFile(file: CompiledFile): Promise<void> {
  if (!file.change) {
    return
  }
  file.change = false
  if (file.filename.endsWith(".vue")) {
    await compileVueSFCFile(file)
  } else if (file.filename.endsWith(".ts")) {
    const js = await getRunnableJS(file.filename)
    file.compiled.js = js
  }
}
