import { EventListen } from "./eventListener"
import { BaseFile } from "./baseFile"

type FileSystemEventMap<FileType> = {
  update: (file: FileType) => void;
  delete: (filename: string) => void;
}

export class FileSystem<FileType extends BaseFile> extends EventListen<FileSystemEventMap<FileType>> {
  private files: Record<string, FileType> = {}

  constructor() {
    super()
    console.log('[vfs]', import.meta.globEager("@/sample/vue/*", { as: "raw" }))
  }

  isExist(filename: string) {
    return this.files[filename] !== undefined
  }

  readFile(filename: string): FileType | undefined {
    return this.files[filename]
  }

  writeFile<T extends FileType> (file: T, content: string): T {
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
}

// export function createOrGetFile(fs: FileSystem<CompiledFile>, filename: string, content: string) {
//   let file: CompiledFile
//   if (fs.isExist(filename)) {
//     file = fs.writeFile(new CompiledFile(filename), content)
//   } else {
//     file = fs.readFile(filename)!
//   }
//   return file
// }
