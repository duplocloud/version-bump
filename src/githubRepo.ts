import * as github from '@actions/github';
// import * as core from '@actions/core';

export class GithubRepo {
  private octokit: any;
  private repoOwner: string;
  private repoName: string;

  constructor(token: string, repoName: string) {
    this.octokit = github.getOctokit(token);
    const [owner, name] = repoName.split('/');
    this.repoOwner = owner;
    this.repoName = name;
  }

  async listTags() {
    const response = await this.octokit.rest.git.listMatchingRefs({
      owner: this.repoOwner,
      repo: this.repoName,
      ref: 'tags/v',
    });
    return response.data;
  }

  async publish(tag: string, file: string, content: string): Promise<void> {
    const baseCommit = await this.getBaseCommit();
    const baseTree = baseCommit.data.object.sha;
    const tree = await this.createTree(baseTree, file, content);
    const commit = await this.createCommit(baseTree, tree.data.sha, `Bump version to ${tag}`);
    await this.updateMain(commit.data.sha);
    await this.createTag(tag, commit.data.sha);
  }

  private async getBaseCommit() {
    return this.octokit.git.getRef({
      owner: this.repoOwner,
      repo: this.repoName,
      ref: 'heads/main',
    });
  }

  private async createTree(baseTree: string, file: string, content: string) {
    return this.octokit.git.createTree({
      owner: this.repoOwner,
      repo: this.repoName,
      base_tree: baseTree,
      tree: [{
        path: file,
        mode: '100644',
        type: 'blob',
        content: content,
      }],
    });
  }

  private async createCommit(baseTree: string, treeSha: string, message: string) {
    return this.octokit.git.createCommit({
      owner: this.repoOwner,
      repo: this.repoName,
      message: message,
      tree: treeSha,
      parents: [baseTree],
    });
  }

  private async updateMain(commitSha: string) {
    return this.octokit.git.updateRef({
      owner: this.repoOwner,
      repo: this.repoName,
      ref: 'heads/main',
      sha: commitSha,
    });
  }

  private async createTag(tag: string, commitSha: string) {
    return this.octokit.git.createRef({
      owner: this.repoOwner,
      repo: this.repoName,
      ref: `refs/tags/${tag}`,
      sha: commitSha,
    });
  }

  async generateReleaseNotes(tagName: string, previousTagName?: string, targetCommitish?: string) {
    const body: any = { tag_name: tagName };
    if (previousTagName) body.previous_tag_name = previousTagName;
    if (targetCommitish) body.target_commitish = targetCommitish;

    const response = await this.octokit.repos.generateReleaseNotes({
      owner: this.repoOwner,
      repo: this.repoName,
      ...body,
    });

    return response.data;
  }
}
