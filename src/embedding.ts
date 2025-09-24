/**
 * @fileoverview Embedding service using node-llama-cpp for local model inference.
 * Provides text embedding functionality for semantic similarity matching.
 * Strictly follows official node-llama-cpp API documentation.
 */

import {getLlama} from 'node-llama-cpp';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Configuration options for the EmbeddingService.
 */
export interface EmbeddingConfig {
  readonly modelPath: string;
  readonly contextSize?: number;
  readonly gpuLayers?: number;
  readonly threads?: number | undefined;
  readonly batchSize?: number;
}

/**
 * Service class for generating text embeddings using local GGUF models.
 * Implements official node-llama-cpp API patterns.
 */
export class EmbeddingService {
  private readonly modelPath: string;
  private readonly config: EmbeddingConfig;
  private model: any = null;
  private context: any = null;
  private session: any = null;
  private isInitialized: boolean = false;

  /**
   * Creates a new EmbeddingService instance.
   * @param config Configuration options for the embedding service
   * @throws {Error} If the model file doesn't exist
   */
  constructor(config: EmbeddingConfig) {
    this.config = config;
    this.modelPath = config.modelPath;
    
    if (!fs.existsSync(this.modelPath)) {
      throw new Error(`Model file not found: ${this.modelPath}`);
    }

    console.log(`EmbeddingService created with model: ${this.modelPath}`);
  }

  /**
   * Initializes the embedding service by loading the model.
   * Uses official node-llama-cpp initialization pattern.
   * @returns Promise that resolves when initialization is complete
   * @throws {Error} If initialization fails
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('Loading Llama model with official API...');
      
      // Get llama instance using official API
      const llama = await getLlama();
      
      // Load model using official API
      this.model = await llama.loadModel({
        modelPath: this.modelPath,
        gpuLayers: this.config.gpuLayers ?? 0,
      });

      // Create embedding context specifically for embedding generation
      this.context = await this.model.createEmbeddingContext({
        contextSize: this.config.contextSize ?? 2048,
        batchSize: this.config.batchSize ?? 512,
        threads: this.config.threads,
      });

      // The embedding context is what we'll use for generating embeddings
      this.session = this.context;

      this.isInitialized = true;
      console.log('Embedding service initialized successfully with official API');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to initialize embedding service: ${errorMessage}`);
    }
  }

  /**
   * Generates an embedding vector for the given text.
   * Uses the model's internal embedding capabilities.
   * @param text Input text to embed
   * @returns Promise resolving to the embedding vector
   * @throws {Error} If embedding generation fails
   */
  public async getEmbedding(text: string): Promise<number[]> {
    if (!text.trim()) {
      throw new Error('Input text cannot be empty');
    }

    if (!this.isInitialized || !this.context || !this.session) {
      throw new Error('Embedding service not initialized. Call initialize() first.');
    }

    try {
      console.log(`Generating embedding for: "${text.trim().substring(0, 50)}..."`);
      
      // Use the correct EmbeddingContext API
      const embeddingResult = await this.context.getEmbeddingFor(text.trim());
      
      if (!embeddingResult || !embeddingResult.vector || !Array.isArray(embeddingResult.vector) || embeddingResult.vector.length === 0) {
        throw new Error('Invalid embedding result: expected LlamaEmbedding with non-empty vector array');
      }

      return Array.from(embeddingResult.vector);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to generate embedding: ${errorMessage}`);
    }
  }

  /**
   * Gets the embedding dimension for this model.
   * @returns Promise resolving to the embedding vector dimension
   * @throws {Error} If dimension cannot be determined
   */
  public async getEmbeddingDimension(): Promise<number> {
    if (!this.isInitialized || !this.model) {
      throw new Error('Embedding service not initialized. Call initialize() first.');
    }

    try {
      // Use the model's built-in embedding vector size
      const dimension = this.model.embeddingVectorSize;
      if (dimension && dimension > 0) {
        return dimension;
      }
      
      // Fallback: generate a test embedding to determine dimension
      const testEmbedding = await this.getEmbedding('test');
      return testEmbedding.length;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to determine embedding dimension: ${errorMessage}`);
    }
  }

  /**
   * Generates embeddings for multiple texts in batch.
   * @param texts Array of input texts
   * @returns Promise resolving to array of embedding vectors
   * @throws {Error} If batch processing fails
   */
  public async getBatchEmbeddings(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }

    const embeddings: number[][] = [];
    
    for (const text of texts) {
      const embedding = await this.getEmbedding(text);
      embeddings.push(embedding);
    }

    return embeddings;
  }

  /**
   * Disposes of the model and context to free up resources.
   * Follows official cleanup pattern.
   */
  public dispose(): void {
    try {
      if (this.session) {
        // Sessions don't typically have explicit dispose methods
        this.session = null;
      }
      
      if (this.context) {
        this.context.dispose();
        this.context = null;
      }
      
      if (this.model) {
        this.model.dispose();
        this.model = null;
      }
      
      this.isInitialized = false;
      console.log('Embedding service resources disposed');
    } catch (error) {
      console.error('Error disposing embedding service:', error);
    }
  }

  /**
   * Gets information about the loaded model.
   * @returns Model information object
   */
  public getModelInfo(): {readonly modelPath: string; readonly fileName: string} {
    return {
      modelPath: this.modelPath,
      fileName: path.basename(this.modelPath),
    };
  }

  /**
   * Checks if the service is initialized.
   * @returns True if initialized, false otherwise
   */
  public getIsInitialized(): boolean {
    return this.isInitialized;
  }
}

/**
 * Factory function to create an EmbeddingService with default settings.
 * @param modelPath Path to the GGUF model file
 * @returns Promise resolving to initialized EmbeddingService
 * @throws {Error} If creation or initialization fails
 */
export async function createEmbeddingService(modelPath: string): Promise<EmbeddingService> {
  const config: EmbeddingConfig = {
    modelPath,
    contextSize: 2048,
    gpuLayers: 0, // Default to CPU-only for compatibility
    threads: undefined, // Let node-llama-cpp decide
    batchSize: 512,
  };

  const service = new EmbeddingService(config);
  
  // Initialize the service
  await service.initialize();
  
  // Verify the service works by getting dimension
  await service.getEmbeddingDimension();
  
  return service;
}