// filepath: /Users/kelly/workspaces/duplocloud/cicd/version-action/src/types/index.ts

export interface ReleaseNotes {
  title: string
  body: string
  installationNotes: string
}

export interface VersionInfo {
  major: number
  minor: number
  patch: number
  prerelease?: string
}

export interface ChangelogEntry {
  version: string
  date: string
  notes: string[]
}
