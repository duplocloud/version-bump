export declare class GithubRepo {
    private octokit;
    private repoOwner;
    private repoName;
    constructor(token: string, repoName: string);
    listTags(): Promise<any>;
    publish(tag: string, file: string, content: string): Promise<void>;
    private getBaseCommit;
    private createTree;
    private createCommit;
    private updateMain;
    private createTag;
    generateReleaseNotes(tagName: string, previousTagName?: string, targetCommitish?: string): Promise<any>;
}
