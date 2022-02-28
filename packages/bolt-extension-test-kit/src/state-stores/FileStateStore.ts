import { sign, verify } from 'jsonwebtoken';
import { InstallURLOptions, StateStore } from '@slack/oauth';
import { homedir } from 'os';
import fs from 'fs';
import path from 'path';
import { InvalidStateError, StateObj } from '../workaround';

export interface FileStateStoreArgs {
  stateSecret: string;
  stateExpirationSeconds?: number;
  baseDir?: string;
}

export default class FileStateStore implements StateStore {
  private baseDir: string;

  private stateSecret: string;

  private stateExpirationSeconds: number;

  public constructor(args: FileStateStoreArgs) {
    this.baseDir = args.baseDir !== undefined ?
      args.baseDir :
      `${homedir()}/.bolt-js-oauth-states`;
    this.stateSecret = args.stateSecret;
    this.stateExpirationSeconds = args.stateExpirationSeconds !== undefined ?
      args.stateExpirationSeconds :
      600;
  }

  public async generateStateParam(
    installOptions: InstallURLOptions,
    now: Date,
  ): Promise<string> {
    const source = {
      installOptions,
      now: now.toJSON(),
      random: Math.floor(Math.random() * 1000000),
    };
    const state = sign(source, this.stateSecret);
    this.writeToFile(state);
    return state;
  }

  public async verifyStateParam(
    now: Date,
    state: string,
  ): Promise<InstallURLOptions> {
    try {
      if (this.findFile(state)) {
        // decode the state using the secret
        let decoded: StateObj;
        try {
          decoded = verify(state, this.stateSecret) as StateObj;
        } catch (e) {
          const message = `Failed to load the data represented by the state parameter (error: ${e})`;
          throw new InvalidStateError(message);
        }
        // Check if the state value is not too old
        const generatedAt = new Date(decoded.now);
        const passedSeconds = Math.floor(
          (now.getTime() - generatedAt.getTime()) / 1000,
        );
        if (passedSeconds > this.stateExpirationSeconds) {
          throw new InvalidStateError('The state value is already expired');
        }
        // return installOptions
        return decoded.installOptions;
      }
    } finally {
      this.deleteFile(state);
    }
    throw new InvalidStateError('The state value is already expired');
  }

  private writeToFile(data: string): void {
    fs.mkdirSync(this.baseDir, { recursive: true });
    // To make the scan faster without any additional dependencies
    const indexPath = path.resolve(`${this.baseDir}/index`);

    // Use as a short name as possible to avoid
    // "Error: ENAMETOOLONG: name too long, open" error
    let filenameLength = 1;
    while (filenameLength < data.length) {
      const filename = toFilename(data, filenameLength);
      const fullpath = path.resolve(`${this.baseDir}/${filename}`);
      if (!fs.existsSync(fullpath)) {
        fs.writeFileSync(fullpath, data);
        fs.appendFileSync(indexPath, `${filename}\n`);
        return;
      }
      filenameLength += 1;
    }
  }

  private findFile(data: string): boolean {
    // To make the scan faster without any additional dependencies
    const indexPath = path.resolve(`${this.baseDir}/index`);
    const list = fs.readFileSync(indexPath).toString();
    let found = false;
    const filenames = list
      .split('\n')
      .filter((f) => f.length !== 0 && data.endsWith(f));
    filenames.forEach((filename) => {
      if (!found) {
        const fullpath = path.resolve(`${this.baseDir}/${filename}`);
        if (fs.existsSync(fullpath)) {
          try {
            const content = fs.readFileSync(fullpath).toString();
            found = content === data;
          } catch (_) {
            // ignored
          }
        }
      }
    });
    return found;
  }

  private deleteFile(data: string): void {
    if (this.findFile(data)) {
      // To make the scan faster without any additional dependencies
      const indexPath = path.resolve(`${this.baseDir}/index`);
      // Use as a short name as possible to avoid
      // "Error: ENAMETOOLONG: name too long, open" error
      let filenameLength = 1;
      while (filenameLength < data.length) {
        const filename = toFilename(data, filenameLength);
        const fullpath = path.resolve(`${this.baseDir}/${filename}`);
        if (fs.existsSync(fullpath)) {
          fs.unlinkSync(fullpath);
          fs.writeFileSync(
            indexPath,
            fs
              .readFileSync(indexPath)
              .toString()
              .split('\n')
              .filter((f) => f !== filename)
              .join('\n'),
          );
        }
        filenameLength += 1;
      }
    }
  }
}

function toFilename(data: string, length: number): string {
  const fullLength = data.length;
  return data.substring(fullLength - length);
}
