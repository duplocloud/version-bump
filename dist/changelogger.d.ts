export declare class Changelogger {
    private nextVersion;
    private filePath;
    private distFile;
    private changelogContent;
    constructor(nextVersion: string, filePath: string, distFile: string);
    private readChangelog;
    saveChangelog(): Promise<void>;
    newHeader(): string;
    resetChangelog(version: string): Promise<void>;
    getReleaseNotes(version?: string): Promise<string>;
}
