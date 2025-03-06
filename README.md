# Version Bump Action

The Duplocloud version action for bumping a semantic version. This will bump a
semantic version tag with a signed commit back to the repository. This will also
copy the unreleased section of the changelog and add the new version and date
into the changelog effectively resetting the unreleased section to empty. The
next part of the release notes will use the GitHub API to get the generated
release notes from the PRs merged since the last release. Finally the release
notes will take an optional input of a file path to a Markdown file that will be
appended to the release notes.

When using the injected `GITHUB_TOKEN` environment variable, the commits it
makes are not signed. However, it does sign the tags it makes. So when you want
the CI/CD job to make changes and make actual signed commits and tags, then this
action will help. The action uses the GitHub repository API to make all of the Git
actions, ie this does not use the Git cli at all.

## Usage

```yaml
- name: Bump Version
  uses: duplocloud/version-bump@v1
  with:
    version: patch
    token: ${{ secrets.GITHUB_TOKEN }}
```

## Inputs

### `version`

This is the main input for this action. It can either be a semantic version or
one of the following: `major`, `minor`, `patch`, `premajor`, `preminor`,
`prepatch`.

### `changelog`

The path to the changelog file. If not provided, the action will look for a
CHANGELOG.md file in the root of the repository.

### `push`

If the action should push the changes to the repository. If set to false, only
the new version will be outputted without making any real changes.

## GitHub Authentication

You can use the injected `GITHUB_TOKEN` secret to authenticate with the GitHub.
The only downside is you can't allow the `github-actions[bot]` user to override
a protected branch.

```yaml
- name: Bump Version
  uses: duplocloud/version-bump@v1
  with:
    token: ${{ secrets.GITHUB_TOKEN }}
```

If you have a GitHub Application created and the private key downloaded you can
use the `actions/create-github-app-token` action to get a token for the github
API. This token will have the permissions needed to make signed commits and
tags. An application may also be added to a protected branches overrides, eg
this can commit the changelog back to main when it's protected.

```yaml
- name: GitHub App Token
  uses: actions/create-github-app-token@v1
  id: app-token
  with:
    app-id: ${{ vars.GH_APP_ID }}
    private-key: ${{ secrets.GH_APP_KEY }}
- name: Release
  uses: duplocloud/version-bump@main
  with:
    token: ${{ steps.app-token.outputs.token }}
```

## References

- [TypeScript Action Template Repository](https://github.com/actions/typescript-action) -
  Project is using this template.
- [@actions/github](https://www.npmjs.com/package/@actions/github) - Library for
  using the GitHub API within an action.
  - [GitHub Repository](https://github.com/actions/toolkit/tree/main/packages/github)
- [@actions/core](https://github.com/actions/toolkit/tree/main/packages/core)
- [@actions/toolkit](https://github.com/actions/toolkit)
- [Building Custom Actions](https://docs.github.com/en/actions/sharing-automations/creating-actions/about-custom-actions)
- [actions/create-github-app-token](https://github.com/actions/create-github-app-token) -
  The action that uses app creds to get a token for the GitHub API. This is
  ideal for the permissions needed for this application.
- [Unit Testing TypeScript Actions with Jest](https://dev.to/balastrong/write-unit-test-for-your-typescript-github-action-503p)
