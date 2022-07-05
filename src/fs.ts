import { FileSystem } from "@/integrations/vfs"
import { zlibSync, unzlibSync, strToU8, strFromU8 } from 'fflate'

export function utoa(data: string): string {
  const buffer = strToU8(data)
  const zipped = zlibSync(buffer, { level: 9 })
  const binary = strFromU8(zipped, true)
  return btoa(binary)
}

function atou(base64: string): string {
  const binary = atob(base64)

  // zlib header (x78), level 9 (xDA)
  if (binary.startsWith('\x78\xDA')) {
    const buffer = strToU8(binary, true)
    const unzipped = unzlibSync(buffer)
    return strFromU8(unzipped)
  }

  // old unicode hacks for backward compatibility
  // https://base64.guru/developers/javascript/examples/unicode-strings
  return decodeURIComponent(escape(binary))
}

function loadSample(): Record<string, string> {
  const files = import.meta.globEager("@/sample/vue/*", { as: "raw" })
  for(const file in files) {
    const name = file.split('/').pop()!
    const content = files[file]
    files[name] = content
    delete files[file]
  }
  return files as any
}

function loadPackages() {
  const hash = location.hash.slice(1)
  if (!hash) {
    return loadSample()
  }
  console.log(JSON.parse(atou(hash)))
  return JSON.parse(atou(hash))
}


export const fs = new FileSystem(loadPackages())
