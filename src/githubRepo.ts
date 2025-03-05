import * as github from '@actions/github'
// import * as core from '@actions/core';

export class GithubRepo {
  private octokit: any
  private repoOwner: string
  private repoName: string
  public ref: string

  constructor(token: string, repoName: string, ref: string) {
    this.octokit = github.getOctokit(token)
    const [owner, name] = repoName.split('/')
    this.repoOwner = owner
    this.repoName = name
    this.ref = ref.replace('refs/', '')
  }

  async listTags() {
    const response = await this.octokit.rest.git.listMatchingRefs({
      owner: this.repoOwner,
      repo: this.repoName,
      ref: 'tags/v'
    })
    return response.data
  }

  async publish(tag: string, file: string, content: string): Promise<void> {
    const baseCommit = await this.getBaseCommit()
    const baseTree = baseCommit.data.object.sha
    const tree = await this.createTree(baseTree, file, content)
    const commit = await this.createCommit(
      baseTree,
      tree.data.sha,
      `Bump version to ${tag}`
    )
    await this.updateRef(commit.data.sha)
    await this.createTag(tag, commit.data.sha)
  }

  public async getBaseCommit(): Promise<any> {
    return this.octokit.rest.git.getRef({
      owner: this.repoOwner,
      repo: this.repoName,
      ref: this.ref
    })
  }

  private async createTree(baseTree: string, file: string, content: string) {
    return this.octokit.rest.git.createTree({
      owner: this.repoOwner,
      repo: this.repoName,
      base_tree: baseTree,
      tree: [
        {
          path: file,
          mode: '100644',
          type: 'blob',
          content: content
        }
      ]
    })
  }

  private async createCommit(
    baseTree: string,
    treeSha: string,
    message: string
  ) {
    return this.octokit.rest.git.createCommit({
      owner: this.repoOwner,
      repo: this.repoName,
      message: message,
      tree: treeSha,
      parents: [baseTree]
    })
  }

  private async updateRef(commitSha: string) {
    return this.octokit.rest.git.updateRef({
      owner: this.repoOwner,
      repo: this.repoName,
      ref: this.ref, // 'heads/main',
      sha: commitSha
    })
  }

  private async createTag(tag: string, commitSha: string) {
    return this.octokit.rest.git.createRef({
      owner: this.repoOwner,
      repo: this.repoName,
      ref: `refs/tags/${tag}`,
      sha: commitSha
    })
  }

  async generateReleaseNotes(tagName: string, previousTagName: string) {
    const response = await this.octokit.rest.repos.generateReleaseNotes({
      owner: this.repoOwner,
      repo: this.repoName,
      tag_name: tagName,
      previous_tag_name: previousTagName,
      target_commitish: this.ref
    })
    return response.data
  }
}
