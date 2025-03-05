# Release Action

The Duplocloud version action for bumping a semantic version. This will bump a
semantic version tag with a signed commit back to the repository. This will also
copy the unreleased section of the changelog and add the new version and date
into the changelog effectively resetting the unreleased section to empty. The
next part of the release notes will use the Github API to get the generated
release notes from the PRs merged since the last release. Finally the release
notes will take an optional input of a file path to a markdown file that will be
appended to the release notes.

When using the injected `GITHUB_TOKEN` environment variable, the commits it
makes are not signed. However, it does sign the tags it makes. So when you want
the CI/CD job to make changes and make actual signed commits and tags, then this
action will help. The action uses the Github Repos API to make all of the Git
actions, ie this does not use the Git cli at all.

## Usage

```yaml
- name: Bump Version
  uses: duplocloud/version-action@v1
  with:
    version: patch
```

## Inputs

### `version`

This is the main input for this action. It can either be a semantic version or
one of the following: `major`, `minor`, `patch`, `premajor`, `preminor`,
`prepatch`.

## Github Authentication

Once you have a github application created and the private key downloaded you
can use the `actions/create-github-app-token` action to get a token for the
github api. This token will have the permissions needed to make signed commits
and tags.

```yaml
- name: GitHub App Token
  uses: actions/create-github-app-token@v1
  id: app-token
  with:
    app-id: ${{ inputs.app-id }}
    private-key: ${{ inputs.private-key }}
- name: Release
  uses: duplocloud/release-action@main
  with:
    github-token: ${{ steps.app-token.outputs.token }}
```

## References

- [Typescript Action Template Repo](https://github.com/actions/typescript-action) -
  Project is using this template.
- [@actions/github](https://www.npmjs.com/package/@actions/github) - Library for
  using the github api within an action.
  - [github repo](https://github.com/actions/toolkit/tree/main/packages/github)
- [@actions/core](https://github.com/actions/toolkit/tree/main/packages/core)
- [Github actions/toolkit](https://github.com/actions/toolkit)
- [Building Custom Actions](https://docs.github.com/en/actions/sharing-automations/creating-actions/about-custom-actions)
- [actions/create-github-app-token](https://github.com/actions/create-github-app-token) -
  The action that uses app creds to get a token for the github api. This is
  ideal for the permissions needed for this application.
- [Unit Testing Typescript Actions with Jest](https://dev.to/balastrong/write-unit-test-for-your-typescript-github-action-503p)
- [Vercel NCC](https://www.npmjs.com/package/@vercel/ncc) - For packaging the
  action.
