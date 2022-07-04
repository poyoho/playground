import PackagesManager from "./packges.vue"

export interface PackageMeta {
  description: string
  name: string
  source: string
  url: string
  version?: string
  buildStatus?: string
}

export interface Packages {
  name?: string
  version?: string
  dependencies: Record<string, PackageMeta>
}

export {
  PackagesManager
}
