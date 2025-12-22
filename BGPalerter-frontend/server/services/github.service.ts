import simpleGit, { SimpleGit } from 'simple-git';
import { Octokit } from '@octokit/rest';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * GitHub Integration Service
 * Handles automatic commits and pushes of configuration changes
 */

export interface GitCommitOptions {
  filename: string;
  message: string;
  author: {
    name: string;
    email: string;
  };
}

export interface GitStatus {
  modified: string[];
  created: string[];
  deleted: string[];
  renamed: string[];
  staged: string[];
  ahead: number;
  behind: number;
  current: string;
}

class GitHubService {
  private git: SimpleGit;
  private octokit: Octokit | null = null;
  private repoPath: string;
  private remoteUrl: string;
  private branch: string;

  constructor() {
    // Configuration from environment variables
    this.repoPath = process.env.GITHUB_REPO_PATH || '/home/ubuntu/BGPalerter';
    this.remoteUrl = process.env.GITHUB_REMOTE_URL || '';
    this.branch = process.env.GITHUB_BRANCH || 'main';

    // Don't initialize git until we verify the directory exists
    this.git = null as any;

    // Initialize Octokit if token is provided
    const token = process.env.GITHUB_TOKEN;
    if (token) {
      this.octokit = new Octokit({ auth: token });
    }
  }

  /**
   * Initialize git repository if not already initialized
   */
  async initialize(): Promise<void> {
    try {
      // Check if directory exists first
      try {
        await fs.access(this.repoPath);
      } catch (error) {
        console.warn(`[GitHub] Repository path does not exist: ${this.repoPath}`);
        console.warn('[GitHub] GitHub integration will be disabled until BGPalerter is configured');
        return;
      }

      // Initialize simple-git only if directory exists
      if (!this.git) {
        this.git = simpleGit(this.repoPath);
      }

      const isRepo = await this.git.checkIsRepo();
      if (!isRepo) {
        await this.git.init();
        if (this.remoteUrl) {
          await this.git.addRemote('origin', this.remoteUrl);
        }
      }

      // Configure git user
      const userName = process.env.GITHUB_USER_NAME || 'BGPalerter Dashboard';
      const userEmail = process.env.GITHUB_USER_EMAIL || 'bgpalerter@onwave.com';
      
      await this.git.addConfig('user.name', userName);
      await this.git.addConfig('user.email', userEmail);
    } catch (error) {
      console.error('[GitHub] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Commit and push a configuration file change
   */
  async commitAndPush(options: GitCommitOptions): Promise<string> {
    try {
      await this.initialize();
      
      if (!this.git) {
        throw new Error('Git repository not initialized. Please configure GITHUB_REPO_PATH.');
      }

      // Stage the specific file
      const filePath = path.join('config', options.filename);
      await this.git.add(filePath);

      // Create detailed commit message
      const commitMessage = this.formatCommitMessage(options);

      // Commit with author information
      await this.git.commit(commitMessage, undefined, {
        '--author': `${options.author.name} <${options.author.email}>`,
      });

      // Get the commit hash
      const log = await this.git.log({ maxCount: 1 });
      const commitHash = log.latest?.hash || '';

      // Push to remote
      if (this.remoteUrl) {
        await this.git.push('origin', this.branch);
      }

      return commitHash;
    } catch (error) {
      console.error('[GitHub] Failed to commit and push:', error);
      throw new Error(`Git operation failed: ${error}`);
    }
  }

  /**
   * Format a detailed commit message
   */
  private formatCommitMessage(options: GitCommitOptions): string {
    const timestamp = new Date().toISOString();
    return `Updated ${options.filename} via dashboard by ${options.author.name}

${options.message}

Dashboard Version: 1.0.0
Timestamp: ${timestamp}`;
  }

  /**
   * Get repository status
   */
  async getStatus(): Promise<GitStatus> {
    try {
      await this.initialize();
      
      if (!this.git) {
        throw new Error('Git repository not initialized');
      }
      
      const status = await this.git.status();
      const branch = await this.git.branch();

      return {
        modified: status.modified,
        created: status.created,
        deleted: status.deleted,
        renamed: status.renamed.map(r => typeof r === 'string' ? r : r.to),
        staged: status.staged,
        ahead: 0, // simple-git doesn't provide this easily
        behind: 0, // simple-git doesn't provide this easily
        current: branch.current || 'main',
      };
    } catch (error) {
      console.error('[GitHub] Failed to get status:', error);
      throw error;
    }
  }

  /**
   * Get commit history for a file
   */
  async getFileHistory(filename: string, limit: number = 10): Promise<any[]> {
    try {
      await this.initialize();
      
      if (!this.git) {
        return [];
      }
      
      const filePath = path.join('config', filename);
      const log = await this.git.log({ file: filePath, maxCount: limit });

      return log.all.map(commit => ({
        hash: commit.hash,
        date: commit.date,
        message: commit.message,
        author: commit.author_name,
        email: commit.author_email,
      }));
    } catch (error) {
      console.error('[GitHub] Failed to get file history:', error);
      return [];
    }
  }

  /**
   * Get file content at a specific commit
   */
  async getFileAtCommit(filename: string, commitHash: string): Promise<string> {
    try {
      await this.initialize();
      
      if (!this.git) {
        throw new Error('Git repository not initialized');
      }
      
      const filePath = path.join('config', filename);
      const content = await this.git.show([`${commitHash}:${filePath}`]);
      
      return content;
    } catch (error) {
      console.error('[GitHub] Failed to get file at commit:', error);
      throw error;
    }
  }

  /**
   * Restore a file to a previous version
   */
  async restoreFile(filename: string, commitHash: string): Promise<void> {
    try {
      await this.initialize();
      
      if (!this.git) {
        throw new Error('Git repository not initialized');
      }
      
      const filePath = path.join('config', filename);
      
      // Get the file content at the specified commit
      const content = await this.getFileAtCommit(filename, commitHash);
      
      // Write the content back to the file
      const fullPath = path.join(this.repoPath, filePath);
      await fs.writeFile(fullPath, content, 'utf-8');
      
      // Stage and commit the restoration
      await this.git.add(filePath);
      await this.git.commit(`Restored ${filename} to version ${commitHash.substring(0, 7)}`);
      
      // Push if remote is configured
      if (this.remoteUrl) {
        await this.git.push('origin', this.branch);
      }
    } catch (error) {
      console.error('[GitHub] Failed to restore file:', error);
      throw error;
    }
  }

  /**
   * Test GitHub connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.initialize();
      
      if (!this.git) {
        return false;
      }
      
      await this.git.status();
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const githubService = new GitHubService();
