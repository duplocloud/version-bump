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

  async publish(tag: string, contents: Map<string, string>): Promise<void> {
    const treeContent = Array.from(contents).map(([file, content]) => ({
      path: file,
      mode: '100644',
      type: 'blob',
      content: content
    }))
    const baseCommit = await this.getBaseCommit()
    const baseTree = baseCommit.data.object.sha
    const tree = await this.createTree(baseTree, treeContent)
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

  private async createTree(baseTree: string, treeContent: any[]) {
    return this.octokit.rest.git.createTree({
      owner: this.repoOwner,
      repo: this.repoName,
      base_tree: baseTree,
      tree: treeContent
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

  async generateReleaseNotes(tagName: string, previousTagName?: string) {
    const body: any = {
      tag_name: tagName,
      target_commitish: this.ref
    }
    if (previousTagName) body.previous_tag_name = previousTagName

    const response = await this.octokit.rest.repos.generateReleaseNotes({
      owner: this.repoOwner,
      repo: this.repoName,
      ...body
    })

    return response.data
  }
}
