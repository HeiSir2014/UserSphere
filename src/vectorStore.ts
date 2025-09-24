/**
 * @fileoverview Vector store implementation using FAISS for efficient similarity search.
 * Manages intent storage and retrieval for the RAG system.
 * Strictly follows official faiss-node API documentation.
 */

import faiss from 'faiss-node';
const {IndexFlatL2, IndexFlatIP} = faiss;

/**
 * Represents an intent with its associated action and metadata.
 */
export interface Intent {
  readonly id: number;
  readonly text: string;
  readonly action: string;
  readonly description?: string;
  readonly category?: string;
}

/**
 * Search result containing the matched intent and similarity score.
 */
export interface SearchResult {
  readonly intent: Intent;
  readonly score: number;
  readonly distance: number;
}

/**
 * Configuration options for the VectorStore.
 */
export interface VectorStoreConfig {
  readonly dimension: number;
  readonly indexType?: 'L2' | 'IP' | 'COSINE';
  readonly normalizeVectors?: boolean;
}

/**
 * Vector store class for managing intent embeddings and performing similarity search.
 * Uses official faiss-node API for efficient vector operations.
 */
export class VectorStore {
  private index: any = null; // FAISS index instance
  private readonly intents: Intent[] = [];
  private readonly dimension: number;
  private readonly normalizeVectors: boolean;
  private readonly indexType: 'L2' | 'IP' | 'COSINE';

  /**
   * Creates a new VectorStore instance.
   * @param config Configuration options for the vector store
   * @throws {Error} If index creation fails
   */
  constructor(config: VectorStoreConfig) {
    this.dimension = config.dimension;
    this.normalizeVectors = config.normalizeVectors ?? false;
    this.indexType = config.indexType ?? 'L2';
    
    console.log(`VectorStore created for ${this.indexType} index, dimension: ${this.dimension}`);
  }

  /**
   * Initializes the FAISS index asynchronously.
   * Must be called before using the vector store.
   * @throws {Error} If index initialization fails
   */
  public async initialize(): Promise<void> {
    if (this.index) {
      return; // Already initialized
    }

    try {
      switch (this.indexType) {
        case 'L2':
          this.index = new IndexFlatL2(this.dimension);
          break;
        case 'IP':
        case 'COSINE':
          this.index = new IndexFlatIP(this.dimension);
          break;
        default:
          throw new Error(`Unsupported index type: ${this.indexType}`);
      }
      
      console.log(`VectorStore initialized with FAISS ${this.indexType} index, dimension: ${this.dimension}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to initialize FAISS index: ${errorMessage}`);
    }
  }

  /**
   * Normalizes a vector to unit length for cosine similarity.
   * @param vector Input vector to normalize
   * @returns Normalized vector
   * @throws {Error} If vector is invalid
   */
  private normalizeVector(vector: number[]): number[] {
    if (vector.length !== this.dimension) {
      throw new Error(`Vector dimension mismatch: expected ${this.dimension}, got ${vector.length}`);
    }

    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    
    if (magnitude === 0) {
      throw new Error('Cannot normalize zero vector');
    }

    return vector.map(val => val / magnitude);
  }

  /**
   * Preprocesses an embedding vector based on store configuration.
   * @param embedding Raw embedding vector
   * @returns Processed embedding vector
   * @throws {Error} If preprocessing fails
   */
  private preprocessEmbedding(embedding: number[]): number[] {
    let processedEmbedding = [...embedding];

    if (this.normalizeVectors || this.indexType === 'COSINE') {
      processedEmbedding = this.normalizeVector(processedEmbedding);
    }

    return processedEmbedding;
  }

  /**
   * Adds an intent with its embedding to the vector store.
   * Uses official faiss-node add method.
   * @param intent Intent object to add
   * @param embedding Embedding vector for the intent
   * @throws {Error} If adding fails
   */
  public addIntent(intent: Intent, embedding: number[]): void {
    if (!this.index) {
      throw new Error('VectorStore not initialized. Call initialize() first.');
    }

    if (embedding.length !== this.dimension) {
      throw new Error(`Embedding dimension mismatch: expected ${this.dimension}, got ${embedding.length}`);
    }

    // Check for duplicate intent IDs
    if (this.intents.some(existingIntent => existingIntent.id === intent.id)) {
      throw new Error(`Intent with ID ${intent.id} already exists`);
    }

    const processedEmbedding = this.preprocessEmbedding(embedding);
    
    try {
      // faiss-node expects number[] arrays, not Float32Array
      this.index.add(processedEmbedding);
      this.intents.push(intent);
      console.log(`Added intent: ${intent.text} (ID: ${intent.id})`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to add intent to FAISS index: ${errorMessage}`);
    }
  }

  /**
   * Adds multiple intents with their embeddings in batch.
   * Uses efficient batch processing with official faiss-node API.
   * @param intentsWithEmbeddings Array of intent-embedding pairs
   * @throws {Error} If batch addition fails
   */
  public addIntentsBatch(intentsWithEmbeddings: Array<{intent: Intent; embedding: number[]}>): void {
    if (!this.index) {
      throw new Error('VectorStore not initialized. Call initialize() first.');
    }

    if (intentsWithEmbeddings.length === 0) {
      return;
    }

    const embeddings: number[][] = [];
    const newIntents: Intent[] = [];

    // Validate and preprocess all embeddings first
    for (const {intent, embedding} of intentsWithEmbeddings) {
      if (embedding.length !== this.dimension) {
        throw new Error(`Embedding dimension mismatch for intent ${intent.id}: expected ${this.dimension}, got ${embedding.length}`);
      }

      if (this.intents.some(existingIntent => existingIntent.id === intent.id)) {
        throw new Error(`Intent with ID ${intent.id} already exists`);
      }

      const processedEmbedding = this.preprocessEmbedding(embedding);
      embeddings.push(processedEmbedding);
      newIntents.push(intent);
    }

    // Batch add to FAISS index
    try {
      // faiss-node requires adding vectors one by one
      for (const embedding of embeddings) {
        this.index.add(embedding);
      }
      this.intents.push(...newIntents);

      console.log(`Added ${newIntents.length} intents in batch`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to batch add intents to FAISS index: ${errorMessage}`);
    }
  }

  /**
   * Searches for the most similar intents to the query embedding.
   * Uses official faiss-node search method.
   * @param queryEmbedding Query embedding vector
   * @param topK Number of top results to return (default: 1)
   * @param scoreThreshold Minimum similarity score threshold (optional)
   * @returns Array of search results ordered by similarity
   * @throws {Error} If search fails
   */
  public search(queryEmbedding: number[], topK: number = 1, scoreThreshold?: number): SearchResult[] {
    if (!this.index) {
      throw new Error('VectorStore not initialized. Call initialize() first.');
    }

    if (queryEmbedding.length !== this.dimension) {
      throw new Error(`Query embedding dimension mismatch: expected ${this.dimension}, got ${queryEmbedding.length}`);
    }

    if (this.intents.length === 0) {
      return [];
    }

    const processedQuery = this.preprocessEmbedding(queryEmbedding);
    const searchK = Math.min(topK, this.intents.length);
    
    try {
      // Perform search using official faiss-node API
      const searchResult = this.index.search(processedQuery, searchK);
      const results: SearchResult[] = [];

      // Process search results
      const {distances, labels} = searchResult;

      for (let i = 0; i < searchK; i++) {
        const label = labels[i];
        const distance = distances[i];

        if (label === undefined || distance === undefined || label < 0) {
          continue;
        }

        const intent = this.intents[label];
        if (!intent) {
          continue;
        }

        // Convert distance to similarity score based on index type
        let score: number;
        switch (this.indexType) {
          case 'L2':
            // For L2 distance, lower is better. Convert to similarity (0-1 scale)
            // Use exponential decay for better score distribution
            score = Math.exp(-distance / 1000); // Normalize by 1000 for better scale
            break;
          case 'IP':
          case 'COSINE':
            // For inner product/cosine, higher is better (already similarity)
            score = distance;
            break;
          default:
            score = distance;
        }

        // Apply score threshold if specified
        if (scoreThreshold !== undefined && score < scoreThreshold) {
          continue;
        }

        results.push({
          intent,
          score,
          distance,
        });
      }

      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to search FAISS index: ${errorMessage}`);
    }
  }

  /**
   * Finds the single best matching intent for the query.
   * @param queryEmbedding Query embedding vector
   * @param scoreThreshold Minimum similarity score threshold (optional)
   * @returns Best matching intent or null if no match found
   */
  public findBestMatch(queryEmbedding: number[], scoreThreshold?: number): Intent | null {
    const results = this.search(queryEmbedding, 1, scoreThreshold);
    return results.length > 0 ? results[0]!.intent : null;
  }

  /**
   * Gets all stored intents.
   * @returns Array of all intents in the store
   */
  public getAllIntents(): readonly Intent[] {
    return [...this.intents];
  }

  /**
   * Gets an intent by its ID.
   * @param id Intent ID to search for
   * @returns Intent object or undefined if not found
   */
  public getIntentById(id: number): Intent | undefined {
    return this.intents.find(intent => intent.id === id);
  }

  /**
   * Gets intents by category.
   * @param category Category to filter by
   * @returns Array of intents in the specified category
   */
  public getIntentsByCategory(category: string): Intent[] {
    return this.intents.filter(intent => intent.category === category);
  }

  /**
   * Gets statistics about the vector store.
   * @returns Object containing store statistics
   */
  public getStats(): {
    readonly totalIntents: number;
    readonly dimension: number;
    readonly indexType: string;
    readonly normalizeVectors: boolean;
  } {
    return {
      totalIntents: this.intents.length,
      dimension: this.dimension,
      indexType: this.indexType,
      normalizeVectors: this.normalizeVectors,
    };
  }

  /**
   * Clears all intents from the store.
   * Note: FAISS doesn't support efficient removal, so this creates a new index.
   */
  public clear(): void {
    this.intents.length = 0;
    console.log('Cleared all intents from vector store');
  }
}

/**
 * Factory function to create a VectorStore with default L2 configuration.
 * @param dimension Embedding vector dimension
 * @returns New VectorStore instance
 * @throws {Error} If creation fails
 */
export function createVectorStore(dimension: number): VectorStore {
  return new VectorStore({
    dimension,
    indexType: 'L2',
    normalizeVectors: false,
  });
}

/**
 * Factory function to create a VectorStore optimized for cosine similarity.
 * @param dimension Embedding vector dimension
 * @returns New VectorStore instance configured for cosine similarity
 * @throws {Error} If creation fails
 */
export function createCosineVectorStore(dimension: number): VectorStore {
  return new VectorStore({
    dimension,
    indexType: 'COSINE',
    normalizeVectors: true,
  });
}