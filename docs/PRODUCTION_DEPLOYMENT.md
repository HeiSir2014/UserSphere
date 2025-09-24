# UserSphere CLI - 生产环境部署指南

## 🎯 项目概述

UserSphere CLI 是一个完全符合 Google TypeScript 风格指南的 RAG（检索增强生成）CLI 工具，使用官方 `node-llama-cpp` 和 `faiss-node` API 实现本地 embedding 模型推理和向量相似性搜索。

### ✨ 核心特性

- **官方 API 集成**: 严格使用 `node-llama-cpp` 和 `faiss-node` 官方 API
- **ESM 模块支持**: 完全兼容 ES 模块系统
- **多语言支持**: 内置 7 种语言（中文、英文、日文、韩文、西班牙文、法文、德文）
- **智能缓存**: 高效的 embedding 缓存和持久化系统
- **类型安全**: 严格的 TypeScript 类型检查和 Google 风格规范
- **异步初始化**: 优雅的异步模块加载和初始化

## 🏗️ 架构设计

### 模块结构

```
src/
├── embedding.ts      # node-llama-cpp 官方 API 集成
├── vectorStore.ts    # faiss-node 官方 API 集成
├── rag.ts           # RAG 系统核心逻辑
├── actions.ts       # 业务逻辑动作
├── multilang.ts     # 多语言管理器
├── persistence.ts   # 缓存和持久化
└── index.ts         # CLI 入口点
```

### 关键设计模式

1. **工厂模式**: `createDefaultRAGSystem()`, `createVectorStore()`
2. **策略模式**: 多语言模板和动作执行
3. **观察者模式**: 语言检测和响应生成
4. **单例模式**: 持久化管理器和多语言管理器

## 🚀 生产环境部署

### 系统要求

- **Node.js**: >= 18.0.0 (推荐 LTS 版本)
- **内存**: >= 4GB RAM（用于大型 embedding 模型）
- **存储**: >= 2GB 可用空间（模型文件 + 缓存）
- **架构**: x86_64 或 arm64（需匹配预编译二进制文件）

### 1. 环境准备

#### macOS

```bash
# 安装构建工具
xcode-select --install

# 安装 CMake（如果需要从源码编译）
brew install cmake ninja

# 确保使用正确的 Node.js 架构
node -e "console.log(process.arch)" # 应该匹配系统架构
```

#### Linux (Ubuntu/Debian)

```bash
# 安装构建依赖
sudo apt-get update
sudo apt-get install build-essential cmake ninja-build

# 安装 Node.js (推荐使用 nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install --lts
nvm use --lts
```

#### Windows

```powershell
# 安装 Visual Studio Build Tools
# 下载并安装: https://visualstudio.microsoft.com/visual-cpp-build-tools/

# 安装 CMake
choco install cmake ninja

# 或者使用 Visual Studio Installer 安装 C++ 构建工具
```

### 2. 项目安装

```bash
# 克隆项目
git clone <your-repo-url> usersphere-cli
cd usersphere-cli

# 安装依赖
npm install

# 构建项目
npm run build

# 验证安装
npm test
```

### 3. 模型文件下载

#### 推荐模型

```bash
# 创建模型目录
mkdir -p models

# 下载 Qwen3 Embedding 模型 (384维, 推荐)
wget https://huggingface.co/Qwen/Qwen3-Embedding-0.6B-GGUF/resolve/main/Qwen3-Embedding-0.6B-Q8_0.gguf -O models/Qwen3-Embedding-0.6B-Q8_0.gguf

# 或下载 EmbeddingGemma 模型 (768维, 备选)
wget https://huggingface.co/unsloth/embeddinggemma-300m-GGUF/resolve/main/embeddinggemma-300M-Q8_0.gguf -O models/embeddinggemma-300M-Q8_0.gguf
```

### 4. 配置验证

```bash
# 测试真实模型集成
npm run test:real

# 如果出现编译错误，检查构建环境
npm run build --verbose

# 验证模型文件
ls -la models/
```

## 🔧 故障排除

### 常见问题

#### 1. node-llama-cpp 编译失败

```bash
# 确保安装了必要的构建工具
# macOS
xcode-select --install
brew install cmake

# Linux
sudo apt-get install build-essential cmake

# 清理并重新安装
rm -rf node_modules package-lock.json
npm install
```

#### 2. faiss-node 架构不匹配

```bash
# 检查架构匹配
echo "System: $(uname -m)"
echo "Node: $(node -e 'console.log(process.arch)')"

# 重新安装匹配架构的版本
npm uninstall faiss-node
npm install faiss-node
```

#### 3. ESM 模块导入错误

确保 `package.json` 包含：
```json
{
  "type": "module",
  "engines": {
    "node": ">=18.0.0"
  }
}
```

#### 4. 内存不足

```bash
# 增加 Node.js 内存限制
export NODE_OPTIONS="--max-old-space-size=4096"
npm start
```

### 性能优化

#### 1. 缓存配置

```typescript
// 在 src/rag.ts 中调整缓存设置
const config: RAGConfig = {
  embeddingDimension: 384,
  enablePersistence: true,  // 启用持久化缓存
  enableMultiLanguage: true,
  similarityThreshold: 0.3, // 调整相似度阈值
};
```

#### 2. 模型选择

- **Qwen3-Embedding-0.6B**: 384维，速度快，内存占用低
- **EmbeddingGemma-300M**: 768维，精度高，内存占用较大

#### 3. 向量索引优化

```typescript
// 在 src/vectorStore.ts 中选择索引类型
const vectorStore = new VectorStore({
  indexType: 'L2',        // L2距离，通用
  // indexType: 'COSINE',  // 余弦相似度，文本匹配更好
  normalizeVectors: true, // 启用向量归一化
});
```

## 📊 监控和日志

### 性能指标

```typescript
// 监控关键指标
const stats = ragSystem.getStats();
console.log('Performance Metrics:', {
  totalIntents: stats.totalIntents,
  averageQueryTime: stats.averageQueryTime,
  cacheHitRate: stats.cacheHitRate,
  memoryUsage: process.memoryUsage()
});
```

### 日志配置

```bash
# 启用详细日志
export DEBUG=usersphere:*
npm start

# 生产环境日志
export NODE_ENV=production
npm start 2>&1 | tee logs/usersphere.log
```

## 🔐 安全考虑

1. **模型文件验证**: 确保从可信源下载模型文件
2. **输入验证**: 所有用户输入都经过严格验证
3. **内存管理**: 自动释放未使用的模型资源
4. **错误处理**: 完善的错误边界和恢复机制

## 🚀 部署选项

### 1. Docker 部署

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

### 2. PM2 进程管理

```json
{
  "name": "usersphere-cli",
  "script": "dist/index.js",
  "instances": 1,
  "memory": "4096M",
  "env": {
    "NODE_ENV": "production"
  }
}
```

### 3. 系统服务

```ini
[Unit]
Description=UserSphere CLI Service
After=network.target

[Service]
Type=simple
User=usersphere
WorkingDirectory=/opt/usersphere-cli
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

## 📈 扩展和定制

### 添加新语言

```typescript
// 在 src/multilang.ts 中添加新语言模板
const newLanguageTemplates = {
  russian: {
    getUserProfile: ['профиль пользователя', 'личная информация'],
    // ... 更多模板
  }
};
```

### 添加新动作

```typescript
// 在 src/actions.ts 中添加新的业务逻辑
export async function customAction(params: string[]): Promise<string> {
  // 实现自定义逻辑
  return 'Custom action result';
}
```

## 🎉 总结

UserSphere CLI 现已完全符合以下要求：

✅ **严格遵循 Google TypeScript 风格指南**
✅ **使用官方 node-llama-cpp 和 faiss-node API**
✅ **无 fallback 方案，纯官方实现**
✅ **完整的 ESM 模块支持**
✅ **异步初始化和错误处理**
✅ **多语言和缓存支持**
✅ **生产就绪的代码质量**

项目已准备好在生产环境中部署，只需按照上述指南完成环境配置和模型下载即可开始使用！
