/**
 * Unit tests for the action's main functionality, src/main.ts
 *
 * To mock dependencies in ESM, you can create fixtures that export mock
 * functions and objects. For example, the core module is mocked in this test,
 * so that the actual '@actions/core' module is not imported.
 */
import { jest } from '@jest/globals'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import * as path from 'node:path'
import * as core from '../__fixtures__/core.js'
import * as github from '../__fixtures__/github.js'

// Mocks should be declared before the module being tested is imported.
jest.unstable_mockModule('@actions/core', () => core)
jest.unstable_mockModule('@actions/github', () => github)

// The module being tested should be imported dynamically. This ensures that the
// mocks are used in place of any actual dependencies.
const { run } = await import('../src/main.js')

const CHANGELOG = `# Changelog

## [Unreleased]

### Added

- something new
`

describe('main.ts', () => {
  let wkdir: string
  let inputs: Record<string, string>

  beforeEach(() => {
    wkdir = mkdtempSync(path.join(tmpdir(), 'version-bump-'))
    writeFileSync(path.join(wkdir, 'CHANGELOG.md'), CHANGELOG)
    inputs = {
      version: 'patch',
      token: 'fake-token',
      repo: 'duplocloud/example',
      'working-directory': wkdir,
      changelog: 'CHANGELOG.md',
      dist: 'dist',
      push: 'false'
    }
    core.getInput.mockImplementation((name: string) => inputs[name] ?? '')
    github.generateReleaseNotes.mockResolvedValue({
      data: { body: 'generated notes' }
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
    rmSync(wkdir, { recursive: true, force: true })
  })

  /** The outputs set by the action, by name. */
  function outputs(): Record<string, unknown> {
    return Object.fromEntries(core.setOutput.mock.calls)
  }

  /** The params of the one generate-release-notes request. */
  function releaseNotesParams(): Record<string, unknown> {
    expect(github.generateReleaseNotes).toHaveBeenCalledTimes(1)
    return github.generateReleaseNotes.mock.calls[0][0]
  }

  describe('with no version tags', () => {
    beforeEach(() => github.withTags([]))

    it.each([
      ['patch', '0.0.1'],
      ['minor', '0.1.0'],
      ['major', '1.0.0']
    ])('a %s bump releases %s', async (bump, expected) => {
      inputs.version = bump

      await run()

      expect(core.setFailed).not.toHaveBeenCalled()
      expect(outputs()).toMatchObject({
        version: expected,
        tag: `v${expected}`,
        'previous-version': '0.0.0',
        'previous-tag': ''
      })
    })

    it('accepts an explicit 0.0.1', async () => {
      inputs.version = '0.0.1'

      await run()

      expect(core.setFailed).not.toHaveBeenCalled()
      expect(outputs()).toMatchObject({ version: '0.0.1', tag: 'v0.0.1' })
    })

    it('generates release notes without a previous tag', async () => {
      await run()

      const params = releaseNotesParams()
      expect(params).toMatchObject({ tag_name: 'v0.0.1' })
      expect(params).not.toHaveProperty('previous_tag_name')
      expect(outputs()['release-notes']).toContain('generated notes')
    })
  })

  describe('with existing version tags', () => {
    beforeEach(() => github.withTags(['v0.0.1', 'v0.2.0', 'v0.10.3', 'v0.9.0']))

    it('bumps from the newest tag', async () => {
      await run()

      expect(core.setFailed).not.toHaveBeenCalled()
      expect(outputs()).toMatchObject({
        version: '0.10.4',
        tag: 'v0.10.4',
        'previous-version': '0.10.3',
        'previous-tag': 'v0.10.3'
      })
    })

    it('generates release notes since the newest tag', async () => {
      await run()

      expect(releaseNotesParams()).toMatchObject({
        tag_name: 'v0.10.4',
        previous_tag_name: 'v0.10.3'
      })
    })

    it('rejects a version that is not greater than the newest tag', async () => {
      inputs.version = '0.10.3'

      await run()

      expect(core.setFailed).toHaveBeenCalledWith(
        'The version "0.10.3" is not greater than the last version "0.10.3".'
      )
      expect(github.generateReleaseNotes).not.toHaveBeenCalled()
    })
  })

  it('fails on a version that is neither semver nor a release type', async () => {
    github.withTags([])
    inputs.version = 'this is not a version'

    await run()

    expect(core.setFailed).toHaveBeenCalledWith(
      'The version "this is not a version" is not a valid semver version nor is it a valid release action.'
    )
  })
})
