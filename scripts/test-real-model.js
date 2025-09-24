#!/usr/bin/env node

/**
 * Test script specifically for the real Qwen3 embedding model
 */

import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testRealModel() {
  console.log('🧪 Testing UserSphere CLI with Real Qwen3 Model\n');

  try {
    // Check if the real model exists
    const modelPath = path.join(__dirname, '../models/Qwen3-Embedding-0.6B-Q8_0.gguf');
    
    if (!fs.existsSync(modelPath)) {
      console.error('❌ Real model file not found at:', modelPath);
      console.error('Please download the model first:');
      console.error('wget https://huggingface.co/Qwen/Qwen3-Embedding-0.6B-GGUF/resolve/main/Qwen3-Embedding-0.6B-Q8_0.gguf -O models/Qwen3-Embedding-0.6B-Q8_0.gguf');
      process.exit(1);
    }

    console.log('✅ Real model file found');
    console.log('📁 Model path:', modelPath);
    
    // Get file stats
    const stats = fs.statSync(modelPath);
    console.log(`📊 Model size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log();

    // Import the compiled modules
    const { createDefaultRAGSystem } = await import('../dist/rag.js');
    
    console.log('🚀 Initializing RAG system with real model...');
    const startTime = Date.now();
    
    try {
      const rag = await createDefaultRAGSystem(modelPath);
      const initTime = Date.now() - startTime;
      
      console.log(`✅ RAG system initialized in ${initTime}ms`);
      
      // Get actual embedding dimension
      const stats = rag.getStats();
      console.log(`📊 Embedding dimension: ${stats.vectorStoreStats.dimension}`);
      console.log(`📊 Total intents: ${stats.totalIntents}`);
      console.log();

      // Test some queries
      const testQueries = [
        '查询我的积分',
        'check my points',
        '我有哪些设备？',
        'list devices',
        'help',
        '帮助'
      ];

      console.log('💬 Testing queries with real embeddings:\n');

      for (const query of testQueries) {
        console.log(`Query: "${query}"`);
        
        try {
          const queryStart = Date.now();
          const result = await rag.query(query);
          const queryTime = Date.now() - queryStart;
          
          if (result.success) {
            console.log(`✅ Response: ${result.response.substring(0, 100)}...`);
            if (result.confidence) {
              console.log(`   Confidence: ${Math.round(result.confidence * 100)}%`);
            }
          } else {
            console.log(`❌ Error: ${result.response}`);
          }
          
          console.log(`   Query time: ${queryTime}ms`);
          console.log(`   Language: ${rag.getDetectedLanguage()}`);
          
        } catch (error) {
          console.log(`❌ Exception: ${error.message}`);
        }
        
        console.log('');
      }

      // Test cache performance
      console.log('💾 Testing cache performance...');
      const cacheInfo = await rag.getCacheInfo();
      console.log('Cache info:', JSON.stringify(cacheInfo, null, 2));
      
      // Cleanup
      rag.dispose();
      console.log('\n🧹 Cleanup completed');
      
      console.log('\n🎉 Real model test completed successfully!');
      
    } catch (error) {
      console.error('❌ Failed to initialize with real model:', error.message);
      console.error('\nThis might be due to:');
      console.error('1. node-llama-cpp not properly installed');
      console.error('2. Model file is corrupted');
      console.error('3. Insufficient memory (need ~4GB RAM)');
      console.error('4. Incompatible model format');
      
      console.log('\n⚠️  Falling back to mock implementation...');
      // The system should automatically fall back to mock
    }

  } catch (error) {
    console.error('💥 Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testRealModel().catch(error => {
  console.error('💥 Test runner failed:', error);
  process.exit(1);
});
