export declare class GithubRepo {
    private octokit;
    private repoOwner;
    private repoName;
    ref: string;
    constructor(token: string, repoName: string, ref: string);
    listTags(): Promise<ReturnType<typeof this.octokit.rest.git.listMatchingRefs>>;
    publish(tag: string, contents: Map<string, string>): Promise<void>;
    getBaseCommit(): Promise<ReturnType<typeof this.octokit.rest.git.getRef>>;
    private createTree;
    private createCommit;
    private updateRef;
    private createTag;
    generateReleaseNotes(tagName: string, previousTagName?: string): Promise<ReturnType<typeof this.octokit.rest.repos.generateReleaseNotes>>;
}
