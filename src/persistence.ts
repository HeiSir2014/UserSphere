/**
 * @fileoverview Persistence module for caching embeddings and FAISS indices.
 * Provides efficient storage and retrieval of computed embeddings to speed up initialization.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { Intent } from './vectorStore';
import { MultiLangIntentTemplate } from './multilang';

/**
 * Cached embedding data structure.
 */
export interface CachedEmbedding {
  readonly id: string;
  readonly text: string;
  readonly embedding: readonly number[];
  readonly hash: string;
  readonly timestamp: number;
  readonly modelInfo?: {
    readonly modelPath: string;
    readonly dimension: number;
  };
}

/**
 * Cached intent with embedding data.
 */
export interface CachedIntent {
  readonly intent: Intent;
  readonly embedding: CachedEmbedding;
}

/**
 * Persistence metadata structure.
 */
export interface PersistenceMetadata {
  readonly version: string;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly modelPath: string;
  readonly embeddingDimension: number;
  readonly totalIntents: number;
  readonly checksum: string;
}

/**
 * Persistence configuration.
 */
export interface PersistenceConfig {
  readonly dataDirectory: string;
  readonly embeddingsCacheFile?: string;
  readonly metadataFile?: string;
  readonly faissIndexFile?: string;
  readonly compressionEnabled?: boolean;
  readonly maxCacheAge?: number; // in milliseconds
}

/**
 * Persistence manager for handling embedding and index caching.
 */
export class PersistenceManager {
  private readonly config: Required<PersistenceConfig>;
  private readonly dataDir: string;
  private readonly embeddingsCacheFile: string;
  private readonly metadataFile: string;
  private readonly faissIndexFile: string;

  constructor(config: PersistenceConfig) {
    this.config = {
      ...config,
      embeddingsCacheFile: config.embeddingsCacheFile ?? 'embeddings.json',
      metadataFile: config.metadataFile ?? 'metadata.json',
      faissIndexFile: config.faissIndexFile ?? 'faiss.index',
      compressionEnabled: config.compressionEnabled ?? true,
      maxCacheAge: config.maxCacheAge ?? 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    this.dataDir = path.resolve(this.config.dataDirectory);
    this.embeddingsCacheFile = path.join(this.dataDir, this.config.embeddingsCacheFile);
    this.metadataFile = path.join(this.dataDir, this.config.metadataFile);
    this.faissIndexFile = path.join(this.dataDir, this.config.faissIndexFile);

    this.ensureDataDirectory();
  }

  /**
   * Ensures the data directory exists.
   */
  private ensureDataDirectory(): void {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
        console.log(`Created data directory: ${this.dataDir}`);
      }
    } catch (error) {
      throw new Error(`Failed to create data directory: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generates a hash for text content.
   * @param text - Text to hash
   * @returns SHA-256 hash
   */
  private generateHash(text: string): string {
    return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
  }

  /**
   * Generates a checksum for the entire cache.
   * @param cachedEmbeddings - Array of cached embeddings
   * @returns Checksum string
   */
  private generateChecksum(cachedEmbeddings: CachedEmbedding[]): string {
    const content = cachedEmbeddings
      .map(ce => `${ce.id}:${ce.hash}:${ce.timestamp}`)
      .sort()
      .join('|');
    return this.generateHash(content);
  }

  /**
   * Saves embeddings to cache file.
   * @param cachedIntents - Array of cached intents with embeddings
   * @param modelPath - Path to the embedding model
   * @param embeddingDimension - Dimension of embeddings
   */
  public async saveCachedEmbeddings(
    cachedIntents: CachedIntent[],
    modelPath: string,
    embeddingDimension: number
  ): Promise<void> {
    try {
      const cachedEmbeddings = cachedIntents.map(ci => ci.embedding);
      const metadata: PersistenceMetadata = {
        version: '1.0.0',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        modelPath,
        embeddingDimension,
        totalIntents: cachedIntents.length,
        checksum: this.generateChecksum(cachedEmbeddings),
      };

      const cacheData = {
        metadata,
        embeddings: cachedEmbeddings,
        intents: cachedIntents.map(ci => ci.intent),
      };

      // Save to file
      const jsonData = JSON.stringify(cacheData, null, 2);
      await fs.promises.writeFile(this.embeddingsCacheFile, jsonData, 'utf8');
      
      // Save metadata separately
      await fs.promises.writeFile(this.metadataFile, JSON.stringify(metadata, null, 2), 'utf8');

      console.log(`Saved ${cachedIntents.length} cached embeddings to ${this.embeddingsCacheFile}`);
    } catch (error) {
      throw new Error(`Failed to save cached embeddings: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Loads embeddings from cache file.
   * @param modelPath - Expected model path for validation
   * @param embeddingDimension - Expected embedding dimension for validation
   * @returns Array of cached intents or null if cache is invalid/missing
   */
  public async loadCachedEmbeddings(
    modelPath: string,
    embeddingDimension: number
  ): Promise<CachedIntent[] | null> {
    try {
      // Check if cache file exists
      if (!fs.existsSync(this.embeddingsCacheFile)) {
        console.log('No cached embeddings found');
        return null;
      }

      // Load and parse cache file
      const jsonData = await fs.promises.readFile(this.embeddingsCacheFile, 'utf8');
      const cacheData = JSON.parse(jsonData);

      // Validate cache structure
      if (!cacheData.metadata || !cacheData.embeddings || !cacheData.intents) {
        console.warn('Invalid cache file structure');
        return null;
      }

      const metadata: PersistenceMetadata = cacheData.metadata;

      // Validate model compatibility
      if (metadata.modelPath !== modelPath) {
        console.warn(`Model path mismatch: expected ${modelPath}, got ${metadata.modelPath}`);
        return null;
      }

      if (metadata.embeddingDimension !== embeddingDimension) {
        console.warn(`Embedding dimension mismatch: expected ${embeddingDimension}, got ${metadata.embeddingDimension}`);
        return null;
      }

      // Check cache age
      const cacheAge = Date.now() - metadata.updatedAt;
      if (cacheAge > this.config.maxCacheAge) {
        console.warn(`Cache is too old (${Math.round(cacheAge / (24 * 60 * 60 * 1000))} days), ignoring`);
        return null;
      }

      // Validate checksum
      const embeddings: CachedEmbedding[] = cacheData.embeddings;
      const expectedChecksum = this.generateChecksum(embeddings);
      if (metadata.checksum !== expectedChecksum) {
        console.warn('Cache checksum mismatch, cache may be corrupted');
        return null;
      }

      // Reconstruct cached intents
      const intents: Intent[] = cacheData.intents;
      const cachedIntents: CachedIntent[] = [];

      for (let i = 0; i < Math.min(embeddings.length, intents.length); i++) {
        cachedIntents.push({
          intent: intents[i]!,
          embedding: embeddings[i]!,
        });
      }

      console.log(`Loaded ${cachedIntents.length} cached embeddings from cache`);
      return cachedIntents;

    } catch (error) {
      console.error(`Failed to load cached embeddings: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  /**
   * Creates a cached embedding from text and embedding vector.
   * @param id - Unique identifier
   * @param text - Original text
   * @param embedding - Embedding vector
   * @param modelPath - Model path for metadata
   * @param dimension - Embedding dimension
   * @returns Cached embedding object
   */
  public createCachedEmbedding(
    id: string,
    text: string,
    embedding: number[],
    modelPath?: string,
    dimension?: number
  ): CachedEmbedding {
    const result: CachedEmbedding = {
      id,
      text,
      embedding: [...embedding], // Create a copy
      hash: this.generateHash(text),
      timestamp: Date.now(),
    };

    if (modelPath && dimension) {
      (result as any).modelInfo = { modelPath, dimension };
    }

    return result;
  }

  /**
   * Saves FAISS index to file (placeholder - actual implementation depends on faiss-node API).
   * @param indexData - FAISS index data
   */
  public async saveFAISSIndex(indexData: Buffer): Promise<void> {
    try {
      await fs.promises.writeFile(this.faissIndexFile, indexData);
      console.log(`Saved FAISS index to ${this.faissIndexFile}`);
    } catch (error) {
      throw new Error(`Failed to save FAISS index: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Loads FAISS index from file (placeholder - actual implementation depends on faiss-node API).
   * @returns FAISS index data or null if not found
   */
  public async loadFAISSIndex(): Promise<Buffer | null> {
    try {
      if (!fs.existsSync(this.faissIndexFile)) {
        return null;
      }

      const indexData = await fs.promises.readFile(this.faissIndexFile);
      console.log(`Loaded FAISS index from ${this.faissIndexFile}`);
      return indexData;
    } catch (error) {
      console.error(`Failed to load FAISS index: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  /**
   * Saves multi-language templates to a JSON file for backup/sharing.
   * @param templates - Array of multi-language templates
   * @param filename - Output filename (optional)
   */
  public async saveTemplates(templates: MultiLangIntentTemplate[], filename?: string): Promise<void> {
    try {
      const outputFile = filename ? path.join(this.dataDir, filename) : path.join(this.dataDir, 'templates.json');
      
      const templateData = {
        version: '1.0.0',
        timestamp: Date.now(),
        templates,
      };

      await fs.promises.writeFile(outputFile, JSON.stringify(templateData, null, 2), 'utf8');
      console.log(`Saved ${templates.length} templates to ${outputFile}`);
    } catch (error) {
      throw new Error(`Failed to save templates: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Loads multi-language templates from a JSON file.
   * @param filename - Input filename (optional)
   * @returns Array of templates or null if not found
   */
  public async loadTemplates(filename?: string): Promise<MultiLangIntentTemplate[] | null> {
    try {
      const inputFile = filename ? path.join(this.dataDir, filename) : path.join(this.dataDir, 'templates.json');
      
      if (!fs.existsSync(inputFile)) {
        return null;
      }

      const jsonData = await fs.promises.readFile(inputFile, 'utf8');
      const templateData = JSON.parse(jsonData);

      if (!templateData.templates || !Array.isArray(templateData.templates)) {
        console.warn('Invalid template file structure');
        return null;
      }

      console.log(`Loaded ${templateData.templates.length} templates from ${inputFile}`);
      return templateData.templates;
    } catch (error) {
      console.error(`Failed to load templates: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  /**
   * Clears all cached data.
   */
  public async clearCache(): Promise<void> {
    try {
      const filesToDelete = [
        this.embeddingsCacheFile,
        this.metadataFile,
        this.faissIndexFile,
      ];

      for (const file of filesToDelete) {
        if (fs.existsSync(file)) {
          await fs.promises.unlink(file);
          console.log(`Deleted ${file}`);
        }
      }

      console.log('Cache cleared successfully');
    } catch (error) {
      throw new Error(`Failed to clear cache: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Gets cache statistics.
   * @returns Cache statistics object
   */
  public async getCacheStats(): Promise<{
    readonly hasEmbeddingsCache: boolean;
    readonly hasMetadata: boolean;
    readonly hasFAISSIndex: boolean;
    readonly embeddingsCacheSize?: number;
    readonly metadataInfo?: PersistenceMetadata;
    readonly lastUpdated?: number;
  }> {
    const stats = {
      hasEmbeddingsCache: fs.existsSync(this.embeddingsCacheFile),
      hasMetadata: fs.existsSync(this.metadataFile),
      hasFAISSIndex: fs.existsSync(this.faissIndexFile),
    };

    try {
      // Get embeddings cache size
      if (stats.hasEmbeddingsCache) {
        const cacheStats = await fs.promises.stat(this.embeddingsCacheFile);
        (stats as any).embeddingsCacheSize = cacheStats.size;
        (stats as any).lastUpdated = cacheStats.mtime.getTime();
      }

      // Get metadata info
      if (stats.hasMetadata) {
        const metadataContent = await fs.promises.readFile(this.metadataFile, 'utf8');
        (stats as any).metadataInfo = JSON.parse(metadataContent);
      }
    } catch (error) {
      console.warn('Error getting cache stats:', error);
    }

    return stats;
  }

  /**
   * Validates cache integrity.
   * @returns Validation result
   */
  public async validateCache(): Promise<{
    readonly isValid: boolean;
    readonly issues: readonly string[];
  }> {
    const issues: string[] = [];

    try {
      // Check if files exist
      if (!fs.existsSync(this.embeddingsCacheFile)) {
        issues.push('Embeddings cache file not found');
      }

      if (!fs.existsSync(this.metadataFile)) {
        issues.push('Metadata file not found');
      }

      // Validate file contents if they exist
      if (fs.existsSync(this.embeddingsCacheFile)) {
        try {
          const cacheContent = await fs.promises.readFile(this.embeddingsCacheFile, 'utf8');
          const cacheData = JSON.parse(cacheContent);
          
          if (!cacheData.metadata || !cacheData.embeddings || !cacheData.intents) {
            issues.push('Invalid cache file structure');
          }
        } catch (error) {
          issues.push(`Cache file is corrupted: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      if (fs.existsSync(this.metadataFile)) {
        try {
          const metadataContent = await fs.promises.readFile(this.metadataFile, 'utf8');
          JSON.parse(metadataContent); // Just validate JSON structure
        } catch (error) {
          issues.push(`Metadata file is corrupted: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

    } catch (error) {
      issues.push(`Validation error: ${error instanceof Error ? error.message : String(error)}`);
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  /**
   * Gets the data directory path.
   * @returns Absolute path to data directory
   */
  public getDataDirectory(): string {
    return this.dataDir;
  }

  /**
   * Gets the configuration.
   * @returns Persistence configuration
   */
  public getConfig(): Required<PersistenceConfig> {
    return { ...this.config };
  }
}

/**
 * Creates a default persistence manager with standard configuration.
 * @param dataDirectory - Directory for storing cached data
 * @returns Persistence manager instance
 */
export function createPersistenceManager(dataDirectory: string = './data'): PersistenceManager {
  return new PersistenceManager({
    dataDirectory,
    compressionEnabled: true,
    maxCacheAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

/**
 * Utility function to migrate old cache format to new format (if needed).
 * @param oldCacheFile - Path to old cache file
 * @param persistenceManager - Persistence manager instance
 * @returns True if migration was successful
 */
export async function migrateCacheFormat(
  oldCacheFile: string,
  _persistenceManager: PersistenceManager
): Promise<boolean> {
  try {
    if (!fs.existsSync(oldCacheFile)) {
      return false;
    }

    console.log('Migrating old cache format...');
    
    // This would contain migration logic specific to your old format
    // For now, just return false to indicate no migration needed
    
    return false;
  } catch (error) {
    console.error('Cache migration failed:', error);
    return false;
  }
}
