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
    generateReleaseNotes(tag_name: string, previous_tag_name?: string): Promise<ReturnType<typeof this.octokit.rest.repos.generateReleaseNotes>>;
}
