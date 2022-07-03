import { EventListen } from "./eventListener"
import { BaseFile } from "./baseFile"
import { VueSFCFile } from "./vue-sfc"
import { TypescriptFile } from "./typescript"

export type File = BaseFile | VueSFCFile | TypescriptFile
export type CompileFile = VueSFCFile | TypescriptFile

type FileSystemEventMap<FileType> = {
  update: (file: FileType) => void;
  delete: (filename: string) => void;
}

export class FileSystem extends EventListen<FileSystemEventMap<File>> {
  private files: Record<string, File> = {}

  constructor() {
    super()
    const files = import.meta.globEager("@/sample/vue/*", { as: "raw" })
    for(const file in files) {
      const name = file.split('/').pop()!
      const suffix = file.split('.').pop()!
      if (suffix === 'vue') {
        const vueSFC = new VueSFCFile(name, files[file] as unknown as string)
        vueSFC.suffix = suffix
        this.writeFile(vueSFC)
      } else if(suffix === 'ts') {
        const typescript = new TypescriptFile(name)
        typescript.suffix = suffix
        typescript.content = typescript.compiled.js = files[file] as unknown as string
        typescript.change = false
        this.writeFile(typescript)
      } else {
        const baseFile = this.writeBaseFile(name, files[file] as unknown as string)
        baseFile.suffix = suffix
      }
    }
    this.readFile('bootstrap.js')!.private = true
  }

  isExist(filename: string) {
    return this.files[filename] !== undefined
  }

  readFile(filename: string): File | undefined {
    return this.files[filename]
  }

  writeFile(file: File) {
    this.files[file.filename] = file
    this.emit("update", file)
  }

  writeBaseFile(name: string, content: string) {
    const file = new BaseFile(name)
    file.content = content
    file.change = true
    this.files[file.filename] = file
    this.emit("update", file)
    return file
  }

  removeFile(filename: string) {
    delete this.files[filename]
    this.emit("delete", filename)
  }

  clear () {
    this.files = {}
  }

  dirs() {
    return Object.keys(this.files).map(file => this.files[file]).filter(item => !item.private)
  }
}
