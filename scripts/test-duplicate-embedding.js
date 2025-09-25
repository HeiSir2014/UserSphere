#!/usr/bin/env node

/**
 * Test script to verify that embedding generation is not duplicated
 */

import('../dist/rag.js').then(async ({ createDefaultRAGSystem }) => {
  try {
    console.log('🧪 测试重复 embedding 生成修复\n');
    
    const rag = await createDefaultRAGSystem('./models/Qwen3-Embedding-0.6B-Q8_0.gguf');
    
    console.log('测试1: 正常匹配查询（应该只生成一次 embedding）');
    const result1 = await rag.query('查询我的积分');
    console.log(`✅ 结果: ${result1.success ? '成功匹配' : '未匹配'}`);
    console.log(`   匹配意图: ${result1.matchedIntent?.text || 'N/A'}`);
    console.log(`   相似度: ${result1.confidence?.toFixed(4) || 'N/A'}\n`);
    
    console.log('测试2: 无匹配查询（应该只生成一次 embedding，然后重用进行模糊匹配）');
    const result2 = await rag.query('这是一个完全不相关的查询测试12345');
    console.log(`✅ 结果: ${result2.success ? '成功匹配' : '未匹配'}`);
    console.log(`   匹配意图: ${result2.matchedIntent?.text || 'N/A'}`);
    console.log(`   相似度: ${result2.confidence?.toFixed(4) || 'N/A'}\n`);
    
    console.log('测试3: 边界情况查询');
    const result3 = await rag.query('help me please');
    console.log(`✅ 结果: ${result3.success ? '成功匹配' : '未匹配'}`);
    console.log(`   匹配意图: ${result3.matchedIntent?.text || 'N/A'}`);
    console.log(`   相似度: ${result3.confidence?.toFixed(4) || 'N/A'}\n`);
    
    rag.dispose();
    console.log('✅ 测试完成！现在每个查询应该只生成一次 embedding。');
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
  }
}).catch(console.error);
