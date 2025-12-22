import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';

/**
 * File Management Service
 * Handles reading, writing, and validating BGPalerter configuration files
 */

export interface ConfigFile {
  name: string;
  path: string;
  content: string;
  size: number;
  lastModified: Date;
  isYaml: boolean;
}

export interface FileValidation {
  valid: boolean;
  errors: string[];
}

class FileService {
  private configPath: string;
  private allowedFiles: string[];

  constructor() {
    this.configPath = process.env.BGPALERTER_CONFIG_PATH || '/home/ubuntu/BGPalerter/config';
    this.allowedFiles = [
      'config.yml',
      'prefixes.yml',
      'groups.yml',
      'rpki.yml',
      'irr.yml',
      'subs.yml',
    ];
  }

  /**
   * Get list of configuration files
   */
  async listFiles(): Promise<ConfigFile[]> {
    try {
      // Check if config directory exists
      try {
        await fs.access(this.configPath);
      } catch (error) {
        console.warn(`[FileService] Config directory does not exist: ${this.configPath}`);
        console.warn('[FileService] File management will be disabled until BGPalerter is configured');
        return [];
      }

      const files: ConfigFile[] = [];

      for (const filename of this.allowedFiles) {
        const filePath = path.join(this.configPath, filename);
        
        try {
          const stats = await fs.stat(filePath);
          const content = await fs.readFile(filePath, 'utf-8');

          files.push({
            name: filename,
            path: filePath,
            content,
            size: stats.size,
            lastModified: stats.mtime,
            isYaml: filename.endsWith('.yml') || filename.endsWith('.yaml'),
          });
        } catch (error) {
          // File doesn't exist, skip it
          continue;
        }
      }

      return files;
    } catch (error) {
      console.error('[FileService] Failed to list files:', error);
      throw error;
    }
  }

  /**
   * Get a specific configuration file
   */
  async getFile(filename: string): Promise<ConfigFile | null> {
    if (!this.isAllowedFile(filename)) {
      throw new Error(`File ${filename} is not allowed`);
    }

    try {
      const filePath = path.join(this.configPath, filename);
      const stats = await fs.stat(filePath);
      const content = await fs.readFile(filePath, 'utf-8');

      return {
        name: filename,
        path: filePath,
        content,
        size: stats.size,
        lastModified: stats.mtime,
        isYaml: filename.endsWith('.yml') || filename.endsWith('.yaml'),
      };
    } catch (error) {
      console.error(`[FileService] Failed to get file ${filename}:`, error);
      return null;
    }
  }

  /**
   * Save a configuration file
   */
  async saveFile(filename: string, content: string): Promise<void> {
    if (!this.isAllowedFile(filename)) {
      throw new Error(`File ${filename} is not allowed`);
    }

    // Validate YAML syntax before saving
    if (filename.endsWith('.yml') || filename.endsWith('.yaml')) {
      const validation = this.validateYAML(content);
      if (!validation.valid) {
        throw new Error(`Invalid YAML: ${validation.errors.join(', ')}`);
      }
    }

    try {
      const filePath = path.join(this.configPath, filename);
      
      // Create backup before writing
      await this.createBackup(filename);
      
      // Write the file atomically (write to temp, then rename)
      const tempPath = `${filePath}.tmp`;
      await fs.writeFile(tempPath, content, 'utf-8');
      await fs.rename(tempPath, filePath);
    } catch (error) {
      console.error(`[FileService] Failed to save file ${filename}:`, error);
      throw error;
    }
  }

  /**
   * Create a backup of a file
   */
  private async createBackup(filename: string): Promise<void> {
    try {
      const filePath = path.join(this.configPath, filename);
      const backupPath = `${filePath}.backup`;
      
      const exists = await fs.access(filePath).then(() => true).catch(() => false);
      if (exists) {
        await fs.copyFile(filePath, backupPath);
      }
    } catch (error) {
      console.error(`[FileService] Failed to create backup for ${filename}:`, error);
      // Don't throw - backup failure shouldn't prevent save
    }
  }

  /**
   * Validate YAML syntax
   */
  validateYAML(content: string): FileValidation {
    try {
      yaml.load(content);
      return { valid: true, errors: [] };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        valid: false,
        errors: [errorMessage],
      };
    }
  }

  /**
   * Check if a filename is allowed
   */
  private isAllowedFile(filename: string): boolean {
    return this.allowedFiles.includes(filename);
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(filename: string): Promise<{
    size: number;
    lastModified: Date;
    exists: boolean;
  }> {
    try {
      const filePath = path.join(this.configPath, filename);
      const stats = await fs.stat(filePath);
      
      return {
        size: stats.size,
        lastModified: stats.mtime,
        exists: true,
      };
    } catch (error) {
      return {
        size: 0,
        lastModified: new Date(),
        exists: false,
      };
    }
  }

  /**
   * Create a new configuration file
   */
  async createFile(filename: string, content: string): Promise<void> {
    if (!this.isAllowedFile(filename)) {
      throw new Error(`File ${filename} is not allowed`);
    }

    const filePath = path.join(this.configPath, filename);
    
    // Check if file already exists
    const exists = await fs.access(filePath).then(() => true).catch(() => false);
    if (exists) {
      throw new Error(`File ${filename} already exists`);
    }

    await this.saveFile(filename, content);
  }

  /**
   * Get diff between two file contents
   */
  getDiff(oldContent: string, newContent: string): {
    added: string[];
    removed: string[];
    modified: string[];
  } {
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');

    const added: string[] = [];
    const removed: string[] = [];
    const modified: string[] = [];

    // Simple line-by-line diff
    const maxLength = Math.max(oldLines.length, newLines.length);
    
    for (let i = 0; i < maxLength; i++) {
      const oldLine = oldLines[i];
      const newLine = newLines[i];

      if (oldLine === undefined && newLine !== undefined) {
        added.push(newLine);
      } else if (oldLine !== undefined && newLine === undefined) {
        removed.push(oldLine);
      } else if (oldLine !== newLine) {
        modified.push(`-${oldLine}\n+${newLine}`);
      }
    }

    return { added, removed, modified };
  }
}

export const fileService = new FileService();
