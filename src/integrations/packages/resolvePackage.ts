export interface Package {
  name: string
  version: string
  types: string
  url: string
  source: string
  description: string
}

export type PackageDependencies = Record<string, Omit<Package, 'name'>>

// package.json
export interface PackageMetadata {
  name: string
  version: string
  types: string
  main: string
  module: string
  unpkg: string
  description: string
  dependencies: Record<string, string>
}

export interface PackageData {
  versions: Record<string, string>
  name: string
  keywords: string[]
  description: string
}

export interface PacakgeVersions {
  tags: Record<string, string>
  versions: string[]
}

const formatName = (name: string) => (name[0] === "/" ? name : `/${name}`)
const formatVersion = (version?: string) => (version ? "@"+version : "")

export const SKYPACK_RECOMMEND = (keyword: string) => `https://api.skypack.dev/v1/search?q=${keyword}&count=12`
export const SKYPACK_PACKAGEDATA = (pkgName: string) => `https://api.skypack.dev/v1/package/${pkgName}`
export const SKYPACK_CDN = (name: string, version?: string, params?: string) => `https://cdn.skypack.dev${formatName(name)}${formatVersion(version)}` + (params || "")

// export async function resolvePackageTypes(name: string, version?: string): Promise<{filePath: string, content: string}[]> {
//   const response = await fetch(SKYPACK_CDN(name, version, "?dts"))
//   if (!response.ok) {
//     return []
//   }
//   const respDTS = await fetch(SKYPACK_CDN(response.headers.get("x-typescript-types")!))
//   if (!response.ok) {
//     return []
//   }
//   const dtsScript = await respDTS.text()
//   const allDTS = await parseDTSModule("vue", dtsScript, async (packageURI: string) => {
//     // load deps packages dts
//     const resp = await fetch(SKYPACK_CDN(packageURI))
//     const dts = await resp.text()
//     return Promise.resolve(dts)
//   })
//   return allDTS.reverse()
// }

export async function resolveRecommendPackage (keyword: string) {
  if (!keyword) {
    return []
  }
  const response = await fetch(SKYPACK_RECOMMEND(keyword))
  if (!response.ok) {
    return []
  }
  return (await response.json()).results
}

export async function resolvePackageData(pkgName: string): Promise<PackageData> {
  const response = await fetch(SKYPACK_PACKAGEDATA(pkgName))
  if (!response.ok) {
    throw "load package data error"
  }
  const res = await response.json()
  console.log('[resolvePackageData]', res)
  return res
}

export async function resolvePackageMetadata(name: string, version: string): Promise<PackageMetadata> {
  const response = await fetch(SKYPACK_CDN(name, version, "/package.json"))
  if (!response.ok)
  {
    throw new Error('Error Resolving Package Data')
  }
  const res = await response.json()
  console.log('[resolvePackageMetadata]', res)
  return res
}

async function resolvePackageList(name: string, version: string): Promise<Package[]> {
  const packages: Package[] = []
  const metadata = await resolvePackageMetadata(name, version)
  console.log('[resolvePackageList]', metadata)

  if (!(metadata instanceof Error)) {
    const dependencies = Object.entries(metadata.dependencies || []).map(([name, version]) => ({ name, version }))
    const resolvedDeps = await Promise.allSettled(dependencies.map(({ name, version }) => resolvePackage(name, version)))

    packages.push(
      {
        name: metadata.name,
        version: metadata.version,
        url: metadata.unpkg || metadata.module || metadata.main,
        types: metadata.types,
        description: metadata.description,
        source: 'NETWORK'
      },
      ...resolvedDeps
        .filter((result) => result.status === 'fulfilled')
        .map((result: any) => result.value)
        .flat()
    )
  }

  return packages.filter((p, i) => packages.findIndex(x => x.name === p.name) === i)
}

export async function resolvePackage(name: string, version: string): Promise<PackageDependencies> {
  const packages = await resolvePackageList(name, version)
  const deps: PackageDependencies = {}
  packages.forEach(pkg => {
    deps[pkg.name] = {
      version: pkg.version,
      types: pkg.types,
      url: pkg.url,
      description: pkg.description,
      source: pkg.source,
    }
  })
  return deps
}
