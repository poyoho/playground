import { getRunnableJS } from "@/integrations/monaco"
import { BaseFile } from "./baseFile"

export class TypescriptFile extends BaseFile {
  public content = ''
  public suffix = ''
  public compiled = {
    js: ''
  }
  public change = true // set it to false after external processing
  constructor(public filename: string) {
    super(filename)
  }

  async compileFile() {
    const js = await getRunnableJS(this.filename)
    this.compiled.js = js
    console.log('[compileFile]', this.compiled);
  }
}
