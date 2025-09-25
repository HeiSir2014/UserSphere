#!/usr/bin/env node

/**
 * Enhanced embedding quality analysis script
 * Tests different similarity metrics and provides detailed diagnostics
 */

import('../dist/rag.js').then(async ({ createDefaultRAGSystem }) => {
  try {
    console.log('🔬 深度分析 Embedding 质量和相似度计算\n');
    
    const rag = await createDefaultRAGSystem('./models/Qwen3-Embedding-0.6B-Q8_0.gguf');
    
    // Test queries with expected high similarity
    const testCases = [
      {
        query: '查询我的积分',
        expectedIntents: ['我的积分', '查询积分', '告诉我账户积分'],
        category: '积分查询'
      },
      {
        query: 'check my points',
        expectedIntents: ['check points', 'my points', 'show points'],
        category: '英文积分查询'
      },
      {
        query: '我有哪些设备？',
        expectedIntents: ['我的设备', '列出设备', '查看设备'],
        category: '设备查询'
      },
      {
        query: '帮助',
        expectedIntents: ['help', 'getHelp', '帮助'],
        category: '帮助请求'
      }
    ];
    
    console.log('📊 测试结果分析:\n');
    
    for (const testCase of testCases) {
      console.log(`🔍 测试类别: ${testCase.category}`);
      console.log(`📝 查询: "${testCase.query}"`);
      
      // Generate query embedding
      const queryEmbedding = await rag.embeddingService.getEmbedding(testCase.query);
      
      // Get top 10 results without threshold to see full distribution
      const searchResults = rag.vectorStore.search(queryEmbedding, 10, 0);
      
      console.log('📈 前10个相似度结果:');
      for (let i = 0; i < Math.min(10, searchResults.length); i++) {
        const result = searchResults[i];
        const isExpected = testCase.expectedIntents.some(intent => 
          result.intent.text.includes(intent) || intent.includes(result.intent.text)
        );
        const indicator = isExpected ? '✅' : '❌';
        
        console.log(`  ${i+1}. ${indicator} "${result.intent.text}" (${result.intent.action})`);
        console.log(`     📊 相似度: ${result.score.toFixed(4)}, 距离: ${result.distance.toFixed(4)}`);
      }
      
      // Calculate metrics
      const topResult = searchResults[0];
      const highQualityMatches = searchResults.filter(r => r.score >= 0.7).length;
      const mediumQualityMatches = searchResults.filter(r => r.score >= 0.5 && r.score < 0.7).length;
      
      console.log(`\n📊 质量分析:`);
      console.log(`   • 最高相似度: ${topResult?.score.toFixed(4) || 'N/A'}`);
      console.log(`   • 高质量匹配 (≥0.7): ${highQualityMatches}`);
      console.log(`   • 中等质量匹配 (0.5-0.7): ${mediumQualityMatches}`);
      console.log(`   • 当前阈值: 0.7`);
      console.log(`   • 是否能匹配: ${topResult && topResult.score >= 0.7 ? '✅ 是' : '❌ 否'}`);
      
      console.log('\n' + '='.repeat(80) + '\n');
    }
    
    // Test vector normalization
    console.log('🧮 向量归一化测试:');
    const testText = '测试文本';
    const embedding = await rag.embeddingService.getEmbedding(testText);
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    console.log(`   • 向量维度: ${embedding.length}`);
    console.log(`   • 向量大小: ${magnitude.toFixed(6)}`);
    console.log(`   • 是否已归一化: ${Math.abs(magnitude - 1.0) < 0.001 ? '✅ 是' : '❌ 否'}`);
    
    // Get system statistics
    console.log('\n📊 系统统计:');
    const stats = rag.getStats();
    console.log(`   • 总意图数量: ${stats.totalIntents}`);
    console.log(`   • 向量存储类型: ${stats.vectorStoreStats.indexType || '未知'}`);
    console.log(`   • 向量归一化: ${stats.vectorStoreStats.normalizeVectors ? '✅ 启用' : '❌ 禁用'}`);
    
    rag.dispose();
    console.log('\n✅ 分析完成！');
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
}).catch(console.error);
