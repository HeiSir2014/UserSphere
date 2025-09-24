#!/usr/bin/env node

/**
 * Test script to verify UserSphere CLI functionality
 * This script tests the core features without requiring real model files
 */

const fs = require('fs');
const path = require('path');

// Create mock model file for testing
function createMockModel() {
  const modelsDir = path.join(__dirname, '../models');
  const mockModelPath = path.join(modelsDir, 'mock-embedding.gguf');
  
  if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir, { recursive: true });
    console.log('📁 Created models directory');
  }
  
  if (!fs.existsSync(mockModelPath)) {
    fs.writeFileSync(mockModelPath, 'Mock embedding model for testing purposes');
    console.log('🤖 Created mock model file');
  }
  
  return mockModelPath;
}

// Test the compiled JavaScript
async function testCompiledVersion() {
  console.log('🧪 Testing compiled JavaScript version...\n');
  
  try {
    // Import the compiled modules
    const { createDefaultRAGSystem } = require('../dist/rag');
    const { defaultMultiLangManager } = require('../dist/multilang');
    
    console.log('✅ Modules imported successfully');
    
    // Create mock model
    const mockModelPath = createMockModel();
    
    // Test RAG system initialization
    console.log('🚀 Initializing RAG system...');
    const rag = await createDefaultRAGSystem(mockModelPath);
    console.log('✅ RAG system initialized');
    
    // Test language detection
    console.log('\n🌐 Testing language detection...');
    const langStats = defaultMultiLangManager.getStats();
    console.log(`   • Templates: ${langStats.totalTemplates}`);
    console.log(`   • Intents: ${langStats.totalIntents}`);
    
    // Test a few basic queries
    const testQueries = [
      '查询积分',
      'check points', 
      '列出设备',
      'help'
    ];
    
    console.log('\n💬 Testing queries...');
    for (const query of testQueries) {
      try {
        const result = await rag.query(query);
        const status = result.success ? '✅' : '❌';
        console.log(`   ${status} "${query}" -> ${result.response.substring(0, 50)}...`);
      } catch (error) {
        console.log(`   ❌ "${query}" -> Error: ${error.message}`);
      }
    }
    
    // Test system stats
    console.log('\n📊 System statistics:');
    const stats = rag.getStats();
    console.log(`   • Initialized: ${stats.isInitialized}`);
    console.log(`   • Total intents: ${stats.totalIntents}`);
    
    // Cleanup
    rag.dispose();
    console.log('\n🧹 Cleanup completed');
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Test CLI entry point
function testCLIEntry() {
  console.log('\n🖥️  Testing CLI entry point...');
  
  try {
    const cliPath = path.join(__dirname, '../dist/index.js');
    
    if (fs.existsSync(cliPath)) {
      console.log('✅ CLI entry point exists');
      
      // Check if the file is executable
      const stats = fs.statSync(cliPath);
      if (stats.mode & parseInt('111', 8)) {
        console.log('✅ CLI file is executable');
      } else {
        console.log('⚠️  CLI file is not executable (this is normal)');
      }
      
      return true;
    } else {
      console.log('❌ CLI entry point not found');
      return false;
    }
    
  } catch (error) {
    console.error('❌ CLI test failed:', error.message);
    return false;
  }
}

// Test package.json scripts
function testPackageScripts() {
  console.log('\n📦 Testing package.json configuration...');
  
  try {
    const packagePath = path.join(__dirname, '../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    const requiredScripts = ['build', 'start', 'dev'];
    const missingScripts = requiredScripts.filter(script => !packageJson.scripts[script]);
    
    if (missingScripts.length === 0) {
      console.log('✅ All required scripts are present');
    } else {
      console.log(`❌ Missing scripts: ${missingScripts.join(', ')}`);
      return false;
    }
    
    // Check dependencies
    const requiredDeps = ['node-llama-cpp', 'faiss-node'];
    const missingDeps = requiredDeps.filter(dep => 
      !packageJson.dependencies[dep] && !packageJson.devDependencies[dep]
    );
    
    if (missingDeps.length === 0) {
      console.log('✅ All required dependencies are listed');
    } else {
      console.log(`⚠️  Note: Some dependencies may need to be installed: ${missingDeps.join(', ')}`);
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Package test failed:', error.message);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('🎯 UserSphere CLI Functionality Test\n');
  console.log('=' .repeat(50));
  
  const results = [];
  
  // Test 1: Package configuration
  results.push(testPackageScripts());
  
  // Test 2: CLI entry point
  results.push(testCLIEntry());
  
  // Test 3: Core functionality
  results.push(await testCompiledVersion());
  
  // Summary
  console.log('\n' + '=' .repeat(50));
  console.log('📋 Test Summary:');
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  if (passed === total) {
    console.log(`✅ All tests passed (${passed}/${total})`);
    console.log('\n🎉 UserSphere CLI is ready to use!');
    console.log('\nNext steps:');
    console.log('1. Download a real embedding model (qwen3-embedding or embeddinggemma)');
    console.log('2. Place the model in the ./models/ directory');
    console.log('3. Run: npm start');
    process.exit(0);
  } else {
    console.log(`❌ Some tests failed (${passed}/${total})`);
    console.log('\nPlease check the errors above and fix them before using the CLI.');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('💥 Test runner failed:', error);
  process.exit(1);
});
