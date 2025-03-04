export declare class GithubRepo {
    private octokit;
    private repoOwner;
    private repoName;
    ref: string;
    constructor(token: string, repoName: string, ref: string);
    listTags(): Promise<any>;
    publish(tag: string, file: string, content: string): Promise<void>;
    getBaseCommit(): Promise<any>;
    private createTree;
    private createCommit;
    private updateRef;
    private createTag;
    generateReleaseNotes(tagName: string, previousTagName?: string): Promise<any>;
}
