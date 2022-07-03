import { BaseFile } from "./baseFile"
import { parseVueSFCFile, compileVueSFCFile } from "@/integrations/compiler/vue"

export interface FileCompile {
  js: string
  css: string
  ssr: string
}

export class VueSFCFile extends BaseFile {
  public script = ''
  public template = ''
  public compiled: FileCompile = {
    js: '',
    ssr: '',
    css: '',
  }

  constructor(filename: string, content?: string) {
    super(filename)
    if (content) {
      const descriptor = parseVueSFCFile(filename, content)
      this.script = (descriptor.script?.content || descriptor.scriptSetup?.content || '').trim()
      this.template = [
        '<template>',
        (descriptor.template?.content || '').trim(),
        '</template>',
      ].join('\n')
    }
  }

  async compileFile() {
    const compiled = await compileVueSFCFile(this.filename, [
      this.template,
      '<script type="script" setup>',
      this.script,
      '</script>',
    ].join('\n'))
    this.compiled = compiled
    console.log('[compileFile]', this.compiled);
  }
}
