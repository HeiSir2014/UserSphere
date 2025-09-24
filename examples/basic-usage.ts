/**
 * @fileoverview Basic usage example for UserSphere CLI
 * Demonstrates how to use the RAG system programmatically
 */

import { createDefaultRAGSystem } from '../src/rag';
import { defaultMultiLangManager } from '../src/multilang';
import * as path from 'path';

async function basicUsageExample(): Promise<void> {
  console.log('🚀 UserSphere CLI Basic Usage Example\n');

  try {
    // Create a mock model file for testing (in production, use a real GGUF file)
    const mockModelPath = path.join(__dirname, '../models/mock-model.gguf');
    
    // For this example, we'll create a placeholder file
    const fs = await import('fs');
    if (!fs.existsSync(path.dirname(mockModelPath))) {
      fs.mkdirSync(path.dirname(mockModelPath), { recursive: true });
    }
    if (!fs.existsSync(mockModelPath)) {
      fs.writeFileSync(mockModelPath, 'mock model file for testing');
    }

    console.log('📁 Initializing RAG system...');
    const rag = await createDefaultRAGSystem(mockModelPath);

    console.log('✅ RAG system initialized successfully!\n');

    // Test multi-language support
    console.log('🌐 Multi-language Support Demo:');
    const langStats = rag.getMultiLanguageStats();
    console.log(`   • Total templates: ${langStats.totalTemplates}`);
    console.log(`   • Total intents: ${langStats.totalIntents}`);
    console.log('   • Language distribution:');
    
    for (const [lang, count] of Object.entries(langStats.languageDistribution)) {
      console.log(`     - ${lang}: ${count} intents`);
    }
    console.log();

    // Test queries in different languages
    const testQueries = [
      // Chinese queries
      '查询我的积分',
      '我有哪些设备？',
      'iPhone在线吗？',
      '添加设备 Samsung-Phone',
      '帮助',
      
      // English queries
      'check my points',
      'list all devices',
      'is MacBook online?',
      'add device iPad-Pro',
      'help',
      
      // Japanese queries
      'ポイント確認',
      'デバイス一覧',
      'システム情報',
    ];

    console.log('💬 Testing Natural Language Queries:\n');

    for (const query of testQueries) {
      console.log(`Query: "${query}"`);
      
      try {
        const result = await rag.query(query);
        
        if (result.success) {
          console.log(`✅ Response: ${result.response}`);
          if (result.matchedIntent) {
            console.log(`   Intent: ${result.matchedIntent.action} (${result.matchedIntent.category})`);
          }
          if (result.confidence) {
            console.log(`   Confidence: ${Math.round(result.confidence * 100)}%`);
          }
        } else {
          console.log(`❌ Error: ${result.response}`);
        }
        
        if (result.executionTime) {
          console.log(`   Time: ${result.executionTime}ms`);
        }
        
        console.log(`   Language: ${rag.getDetectedLanguage()}`);
        
      } catch (error) {
        console.log(`❌ Exception: ${error instanceof Error ? error.message : String(error)}`);
      }
      
      console.log(''); // Empty line for readability
    }

    // Test cache functionality
    console.log('💾 Cache Information:');
    const cacheInfo = await rag.getCacheInfo();
    console.log(JSON.stringify(cacheInfo, null, 2));
    console.log();

    // Test system statistics
    console.log('📊 System Statistics:');
    const stats = rag.getStats();
    console.log(`   • Initialized: ${stats.isInitialized}`);
    console.log(`   • Total intents: ${stats.totalIntents}`);
    console.log(`   • Total templates: ${stats.totalTemplates}`);
    console.log(`   • Vector store stats:`, stats.vectorStoreStats);
    console.log();

    // Cleanup
    rag.dispose();
    console.log('🧹 Cleanup completed');
    
    console.log('\n✨ Example completed successfully!');

  } catch (error) {
    console.error('❌ Example failed:', error);
    process.exit(1);
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  basicUsageExample().catch(console.error);
}

export { basicUsageExample };
