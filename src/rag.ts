/**
 * @fileoverview RAG (Retrieval-Augmented Generation) system for intent matching and action execution.
 * Combines embedding-based semantic search with business logic actions.
 * Now supports multi-language templates and persistent caching.
 */

import { EmbeddingService } from './embedding.js';
import { VectorStore, Intent, createCosineVectorStore } from './vectorStore.js';
import { MultiLanguageManager, defaultMultiLangManager, SupportedLanguage } from './multilang.js';
import { PersistenceManager, createPersistenceManager, CachedIntent } from './persistence.js';
import * as Actions from './actions.js';

/**
 * Configuration for the RAG system.
 */
export interface RAGConfig {
  readonly modelPath: string;
  readonly embeddingDimension: number;
  readonly similarityThreshold?: number;
  readonly maxRetries?: number;
  readonly enableFuzzyMatching?: boolean;
  readonly enableMultiLanguage?: boolean;
  readonly enablePersistence?: boolean;
  readonly dataDirectory?: string;
  readonly preferredLanguages?: readonly SupportedLanguage[];
}

/**
 * Represents an intent template with examples and patterns.
 */
interface IntentTemplate {
  readonly text: string;
  readonly action: Actions.ActionName;
  readonly description: string;
  readonly category: string;
  readonly examples?: readonly string[];
  readonly parameters?: readonly string[];
}

/**
 * Result of a RAG query execution.
 */
export interface RAGResult {
  readonly success: boolean;
  readonly response: string;
  readonly matchedIntent?: Intent;
  readonly confidence?: number;
  readonly executionTime?: number;
}

/**
 * RAG system class that handles intent matching and action execution.
 * Enhanced with multi-language support and persistent caching.
 */
export class RAGSystem {
  private readonly embeddingService: EmbeddingService;
  private readonly vectorStore: VectorStore;
  private readonly config: Required<RAGConfig>;
  private readonly multiLangManager: MultiLanguageManager;
  private readonly persistenceManager: PersistenceManager | null;
  private isInitialized: boolean = false;
  private detectedLanguage: SupportedLanguage = 'en';

  /**
   * Predefined intent templates for the system.
   */
  private readonly intentTemplates: readonly IntentTemplate[] = [
    // User Information Intents
    {
      text: '查询积分',
      action: 'getUserPoints',
      description: '查询用户当前积分余额',
      category: 'user',
      examples: ['我的积分是多少', '积分余额', '查看积分', '告诉我账户积分', '积分查询'],
    },
    {
      text: '查询用户名',
      action: 'getUsername',
      description: '查询用户名信息',
      category: 'user',
      examples: ['我的用户名', '用户名是什么', '查看用户名', '显示用户名'],
    },
    {
      text: '查询头像',
      action: 'getUserAvatar',
      description: '查询用户头像链接',
      category: 'user',
      examples: ['我的头像', '头像链接', '查看头像', '头像地址'],
    },
    {
      text: '查询座右铭',
      action: 'getUserMotto',
      description: '查询用户座右铭',
      category: 'user',
      examples: ['我的座右铭', '个性签名', '座右铭是什么', '查看座右铭'],
    },
    {
      text: '查询用户资料',
      action: 'getUserProfile',
      description: '查询完整用户档案信息',
      category: 'user',
      examples: ['用户资料', '个人信息', '我的档案', '用户档案', '个人资料'],
    },

    // Device Management Intents
    {
      text: '列出设备',
      action: 'listDevices',
      description: '显示所有绑定设备',
      category: 'device',
      examples: ['我的设备', '设备列表', '所有设备', '绑定的设备', '查看设备'],
    },
    {
      text: '在线设备',
      action: 'listOnlineDevices',
      description: '显示当前在线的设备',
      category: 'device',
      examples: ['在线的设备', '哪些设备在线', '在线设备列表', '活跃设备'],
    },
    {
      text: '检查设备状态',
      action: 'checkDeviceStatus',
      description: '查询特定设备的在线状态',
      category: 'device',
      examples: ['设备状态', 'iPhone状态', 'MacBook在线吗', '检查设备', '设备是否在线'],
      parameters: ['deviceName'],
    },
    {
      text: '添加设备',
      action: 'addDevice',
      description: '绑定新设备到账户',
      category: 'device',
      examples: ['绑定设备', '添加新设备', '连接设备', '注册设备'],
      parameters: ['deviceName'],
    },
    {
      text: '删除设备',
      action: 'removeDevice',
      description: '从账户解绑设备',
      category: 'device',
      examples: ['解绑设备', '删除设备', '移除设备', '取消绑定'],
      parameters: ['deviceName'],
    },

    // Utility Intents
    {
      text: '获取帮助',
      action: 'getHelp',
      description: '显示系统帮助信息',
      category: 'utility',
      examples: ['帮助', '使用说明', '功能介绍', '怎么使用', 'help'],
    },
    {
      text: '系统信息',
      action: 'getSystemInfo',
      description: '显示系统状态和统计信息',
      category: 'utility',
      examples: ['系统状态', '统计信息', '系统概况', '状态总览'],
    },
    {
      text: '退出程序',
      action: 'exitProgram',
      description: '退出CLI程序',
      category: 'utility',
      examples: ['退出', '再见', 'exit', 'quit', '结束', '关闭'],
    },
  ];

  /**
   * Creates a new RAG system instance.
   * @param config - Configuration for the RAG system
   */
  constructor(config: RAGConfig) {
    this.config = {
      ...config,
      similarityThreshold: config.similarityThreshold ?? 0.3,
      maxRetries: config.maxRetries ?? 3,
      enableFuzzyMatching: config.enableFuzzyMatching ?? true,
      enableMultiLanguage: config.enableMultiLanguage ?? true,
      enablePersistence: config.enablePersistence ?? true,
      dataDirectory: config.dataDirectory ?? './data',
      preferredLanguages: config.preferredLanguages ?? ['zh', 'en'],
    };

    this.embeddingService = new EmbeddingService({
      modelPath: this.config.modelPath,
      contextSize: 2048,
    });

    // Use cosine similarity for better semantic matching
    this.vectorStore = createCosineVectorStore(this.config.embeddingDimension);
    
    // Initialize multi-language manager if enabled
    this.multiLangManager = this.config.enableMultiLanguage ? 
      defaultMultiLangManager : new MultiLanguageManager();
    
    // Initialize persistence manager if enabled
    this.persistenceManager = this.config.enablePersistence ? 
      createPersistenceManager(this.config.dataDirectory) : null;

    console.log('Enhanced RAG system created with configuration:', {
      modelPath: this.config.modelPath,
      embeddingDimension: this.config.embeddingDimension,
      similarityThreshold: this.config.similarityThreshold,
      enableMultiLanguage: this.config.enableMultiLanguage,
      enablePersistence: this.config.enablePersistence,
      preferredLanguages: this.config.preferredLanguages,
    });
  }

  /**
   * Initializes the RAG system by loading intents and their embeddings.
   * Uses cached embeddings when available for faster startup.
   * @returns Promise that resolves when initialization is complete
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('RAG system already initialized');
      return;
    }

    console.log('Initializing enhanced RAG system...');
    const startTime = Date.now();

    try {
      // Initialize embedding service
      await this.embeddingService.initialize();
      
      // Initialize vector store
      await this.vectorStore.initialize();
      
      // Verify embedding service works
      await this.embeddingService.getEmbeddingDimension();

      let intentsToAdd: Array<{ intent: Intent; embedding: number[] }> = [];

      // Try to load from cache first if persistence is enabled
      if (this.persistenceManager) {
        console.log('Attempting to load cached embeddings...');
        const cachedIntents = await this.persistenceManager.loadCachedEmbeddings(
          this.config.modelPath,
          this.config.embeddingDimension
        );

        if (cachedIntents && cachedIntents.length > 0) {
          console.log(`Found ${cachedIntents.length} cached embeddings`);
          intentsToAdd = cachedIntents.map(ci => ({
            intent: ci.intent,
            embedding: [...ci.embedding.embedding], // Convert readonly array to mutable
          }));
        }
      }

      // If no cached data or cache is invalid, compute embeddings
      if (intentsToAdd.length === 0) {
        console.log('Computing embeddings from templates...');
        intentsToAdd = await this.computeEmbeddings();

        // Save to cache if persistence is enabled
        if (this.persistenceManager && intentsToAdd.length > 0) {
          console.log('Saving embeddings to cache...');
          const cachedIntents: CachedIntent[] = intentsToAdd.map((item, index) => ({
            intent: item.intent,
            embedding: this.persistenceManager!.createCachedEmbedding(
              `intent_${index}`,
              item.intent.text,
              item.embedding,
              this.config.modelPath,
              this.config.embeddingDimension
            ),
          }));

          await this.persistenceManager.saveCachedEmbeddings(
            cachedIntents,
            this.config.modelPath,
            this.config.embeddingDimension
          );
        }
      }

      // Add all intents to the vector store in batch
      this.vectorStore.addIntentsBatch(intentsToAdd);

      this.isInitialized = true;
      const initTime = Date.now() - startTime;
      
      console.log(`Enhanced RAG system initialized successfully in ${initTime}ms`);
      console.log(`Loaded ${intentsToAdd.length} intent embeddings`);
      
      if (this.config.enableMultiLanguage) {
        const langStats = this.multiLangManager.getStats();
        console.log(`Multi-language support: ${langStats.totalIntents} intents across ${Object.keys(langStats.languageDistribution).length} languages`);
      }
      
    } catch (error) {
      throw new Error(`Failed to initialize RAG system: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Computes embeddings for all intent templates.
   * @returns Array of intents with their embeddings
   */
  private async computeEmbeddings(): Promise<Array<{ intent: Intent; embedding: number[] }>> {
    const intentsToAdd: Array<{ intent: Intent; embedding: number[] }> = [];
    let intentId = 0;

    if (this.config.enableMultiLanguage) {
      // Use multi-language templates
      const allTemplates = this.multiLangManager.getAllIntentTemplates();
      
      for (const template of allTemplates) {
        const embedding = await this.embeddingService.getEmbedding(template.text);
        intentsToAdd.push({
          intent: {
            id: intentId++,
            text: template.text,
            action: template.action,
            description: template.description,
            category: template.category,
          },
          embedding,
        });
      }
    } else {
      // Use legacy templates
      for (const template of this.intentTemplates) {
        // Add the main intent
        const mainEmbedding = await this.embeddingService.getEmbedding(template.text);
        intentsToAdd.push({
          intent: {
            id: intentId++,
            text: template.text,
            action: template.action,
            description: template.description,
            category: template.category,
          },
          embedding: mainEmbedding,
        });

        // Add example variations if available
        if (template.examples && template.examples.length > 0) {
          for (const example of template.examples) {
            const exampleEmbedding = await this.embeddingService.getEmbedding(example);
            intentsToAdd.push({
              intent: {
                id: intentId++,
                text: example,
                action: template.action,
                description: template.description,
                category: template.category,
              },
              embedding: exampleEmbedding,
            });
          }
        }
      }
    }

    return intentsToAdd;
  }

  /**
   * Processes a user query and returns the appropriate response.
   * Enhanced with language detection and multi-language support.
   * @param userInput - User's natural language input
   * @returns Promise resolving to the RAG result
   */
  public async query(userInput: string): Promise<RAGResult> {
    if (!this.isInitialized) {
      throw new Error('RAG system not initialized. Call initialize() first.');
    }

    const startTime = Date.now();
    const trimmedInput = userInput.trim();

    if (!trimmedInput) {
      // Detect preferred language for empty input response
      const emptyInputResponses = {
        zh: '请输入您的问题或指令。',
        en: 'Please enter your question or command.',
        ja: '質問またはコマンドを入力してください。',
        ko: '질문이나 명령을 입력하세요.',
        es: 'Por favor ingrese su pregunta o comando.',
        fr: 'Veuillez entrer votre question ou commande.',
        de: 'Bitte geben Sie Ihre Frage oder Ihren Befehl ein.',
      };

      return {
        success: false,
        response: emptyInputResponses[this.detectedLanguage] || emptyInputResponses.en,
        executionTime: Date.now() - startTime,
      };
    }

    try {
      // Detect language if multi-language support is enabled
      if (this.config.enableMultiLanguage) {
        const langDetection = this.multiLangManager.detectLanguage(trimmedInput);
        this.detectedLanguage = langDetection.language;
        
        console.log(`Detected language: ${langDetection.language} (confidence: ${Math.round(langDetection.confidence * 100)}%)`);
      }

      // Generate embedding for user input
      const queryEmbedding = await this.embeddingService.getEmbedding(trimmedInput);
      
      // Search for matching intents
      const searchResults = this.vectorStore.search(
        queryEmbedding,
        3, // Get top 3 matches for better analysis
        this.config.similarityThreshold
      );

      if (searchResults.length === 0) {
        return await this.handleNoMatch(trimmedInput, queryEmbedding, startTime);
      }
      else {
        console.log(`Found ${searchResults.length} matches, best match: ${searchResults[0]!.intent.text} (${searchResults[0]!.score.toFixed(4)})`);
      }

      // Use the best match
      const bestMatch = searchResults[0]!;
      const response = await this.executeAction(bestMatch.intent, trimmedInput);

      return {
        success: true,
        response,
        matchedIntent: bestMatch.intent,
        confidence: bestMatch.score,
        executionTime: Date.now() - startTime,
      };

    } catch (error) {
      console.error('Error processing query:', error);
      
      // Localized error messages
      const errorMessages = {
        zh: `处理查询时发生错误: ${error instanceof Error ? error.message : String(error)}`,
        en: `Error processing query: ${error instanceof Error ? error.message : String(error)}`,
        ja: `クエリ処理中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`,
        ko: `쿼리 처리 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`,
        es: `Error al procesar la consulta: ${error instanceof Error ? error.message : String(error)}`,
        fr: `Erreur lors du traitement de la requête: ${error instanceof Error ? error.message : String(error)}`,
        de: `Fehler bei der Verarbeitung der Anfrage: ${error instanceof Error ? error.message : String(error)}`,
      };

      return {
        success: false,
        response: errorMessages[this.detectedLanguage] || errorMessages.en,
        executionTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Handles cases where no intent match is found.
   * @param userInput - Original user input
   * @param queryEmbedding - Pre-computed query embedding to avoid regeneration
   * @param startTime - Query start time for performance tracking
   * @returns RAG result for no match scenario
   */
  private async handleNoMatch(_userInput: string, queryEmbedding: number[], startTime: number): Promise<RAGResult> {
    if (!this.config.enableFuzzyMatching) {
      return {
        success: false,
        response: '抱歉，我没有理解您的问题。请输入 "帮助" 查看可用功能。',
        executionTime: Date.now() - startTime,
      };
    }

    // Try fuzzy matching with relaxed threshold using existing embedding
    const relaxedResults = this.vectorStore.search(
      queryEmbedding, // Reuse the already computed embedding
      1,
      0.1 // Much lower threshold for fuzzy matching
    );

    if (relaxedResults.length > 0) {
      // sort by score
      const sortedResults = relaxedResults.sort((a, b) => b.score - a.score);
      const fuzzyMatch = sortedResults[0]!;
      return {
        success: false,
        response: `我不太确定您的意思。您是否想要 [${sortedResults.map(r => `"${r.intent.text}"(${r.score.toFixed(4)})`).join(', ')}]？\n请输入 "帮助" 查看所有可用功能。`,
        matchedIntent: fuzzyMatch.intent,
        confidence: fuzzyMatch.score,
        executionTime: Date.now() - startTime,
      };
    }

    return {
      success: false,
      response: '抱歉，我没有理解您的问题。请输入 "帮助" 查看可用功能。',
      executionTime: Date.now() - startTime,
    };
  }

  /**
   * Executes the appropriate action based on the matched intent.
   * @param intent - Matched intent object
   * @param userInput - Original user input for parameter extraction
   * @returns Promise resolving to the action response
   */
  private async executeAction(intent: Intent, userInput: string): Promise<string> {
    const actionName = intent.action;

    try {
      switch (actionName) {
        // User information actions (no parameters needed)
        case 'getUserPoints':
        case 'getUsername':
        case 'getUserAvatar':
        case 'getUserMotto':
        case 'getUserProfile':
        case 'listDevices':
        case 'listOnlineDevices':
        case 'getHelp':
        case 'getSystemInfo':
        case 'exitProgram':
          return Actions.actionRegistry[actionName]();

        // Device actions that need parameter extraction
        case 'checkDeviceStatus':
          return Actions.checkDeviceStatus(userInput);

        case 'addDevice': {
          const deviceName = this.extractDeviceName(userInput);
          if (!deviceName) {
            return '请指定要添加的设备名称。例如: "添加设备 iPhone-16"';
          }
          return Actions.addDevice(deviceName);
        }

        case 'removeDevice': {
          const deviceName = this.extractDeviceName(userInput);
          if (!deviceName) {
            return '请指定要删除的设备名称。例如: "删除设备 iPhone-15"';
          }
          return Actions.removeDevice(deviceName);
        }

        default:
          return `功能 "${actionName}" 暂未实现。`;
      }
    } catch (error) {
      console.error(`Error executing action ${actionName}:`, error);
      return `执行操作时发生错误: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  /**
   * Extracts device name from user input using pattern matching.
   * @param userInput - User input containing device name
   * @returns Extracted device name or null if not found
   */
  private extractDeviceName(userInput: string): string | null {
    // Common patterns for device names in Chinese and English
    const patterns = [
      // Direct device name patterns
      /(?:设备|device)\s*[：:]\s*([a-zA-Z0-9\u4e00-\u9fa5\-_\s]+)/i,
      /(?:添加|删除|绑定|解绑|移除)\s*(?:设备)?\s*([a-zA-Z0-9\u4e00-\u9fa5\-_]+)/i,
      // Device name in quotes
      /["'"]([a-zA-Z0-9\u4e00-\u9fa5\-_\s]+)["'"]/,
      // Common device patterns
      /(iPhone|iPad|MacBook|iMac|Android|Samsung|Huawei)[\-_\s]*([a-zA-Z0-9\u4e00-\u9fa5\-_]*)/i,
      // Generic extraction - last meaningful word/phrase
      /\b([a-zA-Z0-9\u4e00-\u9fa5\-_]{2,})\s*(?:设备|在线|离线|状态)?$/i,
    ];

    for (const pattern of patterns) {
      const match = userInput.match(pattern);
      if (match) {
        let deviceName = match[1]?.trim();
        if (match[2]) {
          deviceName += (deviceName ? '-' : '') + match[2].trim();
        }
        
        if (deviceName && deviceName.length > 1) {
          return deviceName;
        }
      }
    }

    return null;
  }

  /**
   * Gets statistics about the RAG system.
   * @returns System statistics object
   */
  public getStats(): {
    readonly isInitialized: boolean;
    readonly totalIntents: number;
    readonly totalTemplates: number;
    readonly vectorStoreStats: ReturnType<VectorStore['getStats']>;
  } {
    return {
      isInitialized: this.isInitialized,
      totalIntents: this.vectorStore.getStats().totalIntents,
      totalTemplates: this.intentTemplates.length,
      vectorStoreStats: this.vectorStore.getStats(),
    };
  }

  /**
   * Gets all available intent categories.
   * @returns Array of unique categories
   */
  public getCategories(): string[] {
    return [...new Set(this.intentTemplates.map(template => template.category))];
  }

  /**
   * Gets intents by category.
   * @param category - Category to filter by
   * @returns Array of intent templates in the category
   */
  public getIntentsByCategory(category: string): readonly IntentTemplate[] {
    return this.intentTemplates.filter(template => template.category === category);
  }

  /**
   * Clears the embedding cache and forces recomputation on next initialization.
   * @returns Promise that resolves when cache is cleared
   */
  public async clearCache(): Promise<void> {
    if (this.persistenceManager) {
      await this.persistenceManager.clearCache();
      console.log('Embedding cache cleared');
    } else {
      console.log('Persistence is disabled, no cache to clear');
    }
  }

  /**
   * Gets cache statistics and information.
   * @returns Promise resolving to cache statistics
   */
  public async getCacheInfo(): Promise<any> {
    if (this.persistenceManager) {
      return await this.persistenceManager.getCacheStats();
    }
    return { message: 'Persistence is disabled' };
  }

  /**
   * Adds a new multi-language intent template dynamically.
   * @param template - New template to add
   * @returns Promise that resolves when template is added and cached
   */
  public async addIntentTemplate(template: any): Promise<void> {
    if (this.config.enableMultiLanguage) {
      this.multiLangManager.addTemplate(template);
      
      // This would require re-initializing or updating the vector store
      // For now, just log that the template was added
      console.log(`Added new intent template: ${template.id}`);
    }
  }

  /**
   * Gets the detected language of the last query.
   * @returns Current detected language
   */
  public getDetectedLanguage(): SupportedLanguage {
    return this.detectedLanguage;
  }

  /**
   * Sets the preferred language for responses.
   * @param language - Language to set as preferred
   */
  public setPreferredLanguage(language: SupportedLanguage): void {
    this.detectedLanguage = language;
    console.log(`Preferred language set to: ${language}`);
  }

  /**
   * Gets multi-language manager statistics.
   * @returns Multi-language statistics
   */
  public getMultiLanguageStats(): any {
    if (this.config.enableMultiLanguage) {
      return this.multiLangManager.getStats();
    }
    return { message: 'Multi-language support is disabled' };
  }

  /**
   * Disposes of the RAG system and frees resources.
   */
  public dispose(): void {
    try {
      this.embeddingService.dispose();
      this.vectorStore.clear();
      
      if (this.config.enableMultiLanguage) {
        this.multiLangManager.clearCache();
      }
      
      this.isInitialized = false;
      console.log('Enhanced RAG system disposed');
    } catch (error) {
      console.error('Error disposing RAG system:', error);
    }
  }
}

/**
 * Factory function to create and initialize a RAG system.
 * @param config - RAG system configuration
 * @returns Promise resolving to initialized RAG system
 */
export async function createRAGSystem(config: RAGConfig): Promise<RAGSystem> {
  const rag = new RAGSystem(config);
  await rag.initialize();
  return rag;
}

/**
 * Creates a RAG system with default configuration for common embedding models.
 * @param modelPath - Path to the embedding model file
 * @returns Promise resolving to initialized RAG system
 */
export async function createDefaultRAGSystem(modelPath: string): Promise<RAGSystem> {
  // Create a temporary embedding service to determine the actual dimension
  const tempService = new EmbeddingService({
    modelPath,
    contextSize: 512, // Smaller context for dimension detection
  });
  
  await tempService.initialize();
  const actualDimension = await tempService.getEmbeddingDimension();
  tempService.dispose();

  console.log(`Detected embedding dimension: ${actualDimension}`);

  const config: RAGConfig = {
    modelPath,
    embeddingDimension: actualDimension,
    similarityThreshold: 0.65, // Higher threshold for cosine similarity (0-1 range)
    enableFuzzyMatching: true,
    enableMultiLanguage: true,
    enablePersistence: true,
  };

  return createRAGSystem(config);
}
