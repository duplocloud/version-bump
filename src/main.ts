import * as core from '@actions/core'
import { GithubRepo } from './githubRepo.js'
import * as semver from 'semver'
// import * as github from '@actions/github';
import * as path from 'path'
import { Changelogger } from './changelogger.js'

export const RELEASE_TYPES = [
  'major',
  'premajor',
  'minor',
  'preminor',
  'patch',
  'prepatch',
  'prerelease'
]

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const token: string | undefined =
      core.getInput('github-token') || process.env.GITHUB_TOKEN
    const wkdirInput: string =
      core.getInput('working-directory') || process.cwd()
    const distInput: string = core.getInput('dist')
    const repoName: string | undefined =
      core.getInput('repo') || process.env.GITHUB_REPOSITORY
    const gitRef: string = process.env.GITHUB_REF || 'refs/heads/main'
    const push: boolean = core.getInput('push') === 'true'
    let version: string = core.getInput('version')
    let action: string | semver.ReleaseType = 'input'

    const changelogFile: string = core.getInput('changelog')
    // const changelogSectionPrefix: string = core.getInput('changelog-section-prefix')
    // const unreleasedSectionSuffix: string = core.getInput('changelog-unreleased-suffix')

    // get the fully resolved path to the working directory using built in node.js path module
    const wkdir = path.resolve(wkdirInput)
    const distDir = path.resolve(wkdir, distInput)
    const changelogPath = path.resolve(wkdir, changelogFile)
    const changelogDist = path.resolve(distDir, changelogFile)

    // if the token is not set, throw an error
    if (!token) {
      throw new Error(
        'The GitHub token is not set. Please set the "github-token" input or the "GITHUB_TOKEN environment variable.'
      )
    }

    // if the repo is not set, throw an error
    if (!repoName) {
      throw new Error(
        'The repository is not set. Please set the "repo" input or the "GITHUB_REPOSITORY" environment variable.'
      )
    }

    const repo = new GithubRepo(token, repoName, gitRef)
    const tags = await repo.listTags()
    // Find the newest version from the tags
    const lastVersion = tags
      .map((tag: any) => tag.ref.replace('refs/tags/v', ''))
      .reduce(
        (latest: string, current: string) =>
          semver.gt(current, latest) ? current : latest,
        '0.0.1'
      )

    // if the version is a release action then we need to do just that
    if (RELEASE_TYPES.includes(version as semver.ReleaseType)) {
      action = version
      const lastVer = new semver.SemVer(lastVersion)
      const newVer = lastVer.inc(action as semver.ReleaseType)
      version = newVer.version
    } else {
      // validate the version is an actual semver version
      if (!semver.valid(version)) {
        throw new Error(
          `The version "${version}" is not a valid semver version nor is it a valid release action.`
        )
      }
    }

    const tag = `v${version}`
    const lastTag = `v${lastVersion}`

    core.debug(`The version is ${version}`)
    core.debug(`The action is ${action}`)
    core.debug(`The token is ${token}`)
    core.debug(`The working directory is ${wkdir}`)
    core.debug(`The repository is ${repoName}`)
    core.debug(`The dist directory is ${distDir}`)
    core.debug(`The changelog file is ${changelogPath}`)
    core.debug(`The changelog dist is ${changelogDist}`)
    core.debug(`The latest is ${lastVersion}`)

    const cl = new Changelogger(version, changelogPath, changelogDist)
    const clNotes = await cl.getReleaseNotes()
    const prNotes = await repo.generateReleaseNotes(tag, lastTag)
    const notes = clNotes + '\n' + prNotes.body
    const newChangelog = await cl.resetChangelog()

    if (push) {
      await repo.publish(tag, changelogFile, newChangelog)
    }

    // Set outputs for other workflow steps to use
    core.setOutput('version', version)
    core.setOutput('tag', `v${version}`)
    core.setOutput('release-notes', notes)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
