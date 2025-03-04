import { promises as fs } from 'fs';

export class Changelogger {
  private nextVersion: string;
  private filePath: string;
  private distFile: string;
  private changelogContent: string | null = null;
  constructor(
    nextVersion: string, 
    filePath: string, 
    distFile: string
  ) {
    this.filePath = filePath;
    this.nextVersion = nextVersion;
    this.distFile = distFile;
  }

  private async readChangelog(): Promise<string> {
    if (!this.changelogContent) {
      this.changelogContent = await fs.readFile(this.filePath, 'utf-8');
    }
    return this.changelogContent;
  }

  // using the name of the input file, save the new changelog to the dist folder
  public async saveChangelog(): Promise<void> {
    await fs.writeFile(this.distFile, this.changelogContent as any);
  }

  public newHeader(): string {
    const date = new Date().toISOString().split('T')[0];
    return `## [${this.nextVersion}] - ${date}`;
  }

  public async resetChangelog(): Promise<string> {
    const changelog = await this.readChangelog();
    const newHeader = this.newHeader();
    return changelog.replace(/## \[Unreleased\]/, `## [Unreleased]\n\n${newHeader}`);
  }

  public async getReleaseNotes(version: string = "Unreleased"): Promise<string> {
    const changelog = await this.readChangelog();
    const header = `## [${version}]`;
    let inNotes = false;
    let notes: string[] = []
    // iterate each line, when we find the header, start adding lines to the notes, when we find the next section stop iterating
    for (const line of changelog.split('\n')) {
      if (!inNotes && line.startsWith(header)) {
        inNotes = true;
      } else if (inNotes) {
        notes.push(line);
      } else if (inNotes && line.startsWith('## [')) {
        break;
      }
    }
    return notes.join('\n');
  }
}
