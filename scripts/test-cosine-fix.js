#!/usr/bin/env node

/**
 * Quick test to verify cosine similarity fix
 */

import('../dist/rag.js').then(async ({ createDefaultRAGSystem }) => {
  try {
    console.log('🧪 测试余弦相似度修复效果\n');
    
    const rag = await createDefaultRAGSystem('./models/Qwen3-Embedding-0.6B-Q8_0.gguf');
    
    // Quick test queries
    const queries = [
      '查询我的积分',
      'check my points', 
      '我有哪些设备？'
    ];
    
    for (const query of queries) {
      console.log(`🔍 测试: "${query}"`);
      
      const queryEmbedding = await rag.embeddingService.getEmbedding(query);
      const results = rag.vectorStore.search(queryEmbedding, 3, 0);
      
      console.log('前3个结果:');
      results.forEach((result, i) => {
        console.log(`  ${i+1}. "${result.intent.text}" - 相似度: ${result.score.toFixed(4)}`);
      });
      
      // Test with actual threshold
      const thresholdResults = rag.vectorStore.search(queryEmbedding, 3, 0.7);
      console.log(`✅ 阈值0.7以上的匹配: ${thresholdResults.length}个`);
      console.log('');
    }
    
    // Show system config
    const stats = rag.getStats();
    console.log('📊 系统配置:');
    console.log(`  • 索引类型: ${stats.vectorStoreStats.indexType}`);
    console.log(`  • 向量归一化: ${stats.vectorStoreStats.normalizeVectors}`);
    console.log(`  • 总意图数: ${stats.totalIntents}`);
    
    rag.dispose();
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
  }
}).catch(console.error);
