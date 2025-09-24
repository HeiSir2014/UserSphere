#!/usr/bin/env node

import('../dist/rag.js').then(async ({ createDefaultRAGSystem }) => {
  try {
    console.log('🔍 调试相似度匹配问题\n');
    
    const rag = await createDefaultRAGSystem('./models/Qwen3-Embedding-0.6B-Q8_0.gguf');
    
    // 测试失败的查询
    const testQueries = [
      '查询我的积分',
      'check my points',
      '我有哪些设备？'
    ];
    
    for (const query of testQueries) {
      console.log(`\n🔍 测试查询: "${query}"`);
      
      // 生成查询的 embedding
      const queryEmbedding = await rag.embeddingService.getEmbedding(query);
      
      // 直接搜索向量存储以获取相似度分数
      const searchResults = rag.vectorStore.search(queryEmbedding, 5, 0); // 获取前5个结果，无阈值限制
      
      console.log('前5个最相似的意图:');
      for (let i = 0; i < searchResults.length; i++) {
        const result = searchResults[i];
        console.log(`  ${i+1}. "${result.intent.text}" (动作: ${result.intent.action})`);
        console.log(`     相似度: ${result.score.toFixed(4)}, 距离: ${result.distance.toFixed(4)}`);
      }
      
      // 检查当前阈值
      console.log(`当前相似度阈值: 0.3`);
      console.log(`是否有结果超过阈值: ${searchResults.some(r => r.score >= 0.3) ? '是' : '否'}`);
    }
    
    rag.dispose();
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}).catch(console.error);
