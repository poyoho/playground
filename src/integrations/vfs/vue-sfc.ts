import { BaseFile } from "./baseFile"

export interface FileCompile {
  js: string
  css: string
  ssr: string
}


export class CompiledFile extends BaseFile {
  public compiled: FileCompile = {
    js: '',
    ssr: '',
    css: '',
  }
}
