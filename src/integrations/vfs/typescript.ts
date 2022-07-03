import { getRunnableJS } from "@/integrations/monaco"

export class TypescriptFile {
  public content = ''
  public suffix = ''
  public compiled = ''
  public change = true // set it to false after external processing
  constructor(public filename: string) {}

  async compileFile() {
    const js = await getRunnableJS(this.filename)
    this.compiled = js
  }
}
