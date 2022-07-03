export * from "./baseFile"
export * from "./vue-sfc"
import { FileSystem } from "./fs"
export type { File } from "./fs"
export const fs = new FileSystem()
