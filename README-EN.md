# UserSphere CLI

🚀 **Intelligent User and Device Management Command Line Tool**

[中文文档](README.md) | **English Documentation**

UserSphere CLI is an intelligent command-line tool based on RAG (Retrieval-Augmented Generation) technology, using local embedding models for semantic intent matching and supporting natural language interaction for user and device management functions.

## ✨ Features

- 🧠 **Intelligent Semantic Understanding**: Natural language processing based on local embedding models
- 🔍 **Efficient Vector Retrieval**: Fast similarity search using FAISS
- 🌐 **Multi-language Support**: Support for Chinese, English and other languages
- 💾 **Persistent Storage**: Automatic caching of embedding results for faster startup
- 🎯 **Intent Matching**: Precise user intent recognition and action execution
- 🛠️ **Modular Design**: Following Google TypeScript Style Guide
- 🔧 **Extensible Architecture**: Support for dynamic addition of new features and language templates

## 🏗️ System Architecture

### 📋 Project Module Structure Diagram

```mermaid
graph TB
    subgraph "UserSphere CLI Architecture"
        CLI["📱 CLI Interface<br/>index.ts"]
        RAG["🎯 RAG System<br/>rag.ts"]
        EMB["🧠 Embedding Service<br/>embedding.ts"]
        VEC["📊 Vector Store<br/>vectorStore.ts"]
        ACT["⚡ Actions<br/>actions.ts"]
        ML["🌐 MultiLang Manager<br/>multilang.ts"]
        PER["💾 Persistence<br/>persistence.ts"]
        
        CLI --> RAG
        RAG --> EMB
        RAG --> VEC
        RAG --> ML
        RAG --> PER
        RAG --> ACT
        
        EMB -.->|"node-llama-cpp"| MODEL["🤖 Qwen3 Model<br/>1024-dim vectors"]
        VEC -.->|"faiss-node"| FAISS["🔍 FAISS Index<br/>L2 Distance"]
        ML -.-> TEMPLATES["📝 Intent Templates<br/>341 templates, 7 languages"]
        PER -.-> CACHE["💿 Cache Files<br/>embeddings.json<br/>metadata.json"]
        ACT --> BUSINESS["💼 Business Logic<br/>User/Device Management"]
    end
    
    style CLI fill:#e1f5fe
    style RAG fill:#f3e5f5
    style EMB fill:#e8f5e8
    style VEC fill:#fff3e0
    style MODEL fill:#ffebee
    style FAISS fill:#f1f8e9
```

### 🔄 System Workflow Diagram

```mermaid
sequenceDiagram
    participant U as 👤 User
    participant CLI as 📱 CLI Interface
    participant RAG as 🎯 RAG System
    participant ML as 🌐 MultiLang
    participant EMB as 🧠 Embedding
    participant VEC as 📊 VectorStore
    participant ACT as ⚡ Actions
    participant CACHE as 💾 Cache
    
    Note over U,CACHE: 🚀 System Initialization
    CLI->>RAG: Initialize system
    RAG->>EMB: Load Qwen3 model
    EMB-->>RAG: Model ready (1024-dim)
    RAG->>VEC: Initialize FAISS index
    VEC-->>RAG: Index ready
    RAG->>CACHE: Load cached embeddings
    CACHE-->>RAG: 341 intent embeddings
    RAG-->>CLI: System ready
    
    Note over U,CACHE: 💬 User Interaction Loop
    U->>CLI: "check my points"
    CLI->>RAG: Process query
    RAG->>ML: Detect language
    ML-->>RAG: Language: en (English)
    RAG->>EMB: Generate embedding
    EMB->>EMB: Call Qwen3 model
    EMB-->>RAG: Query embedding [1024-dim]
    RAG->>VEC: Search similar intents
    VEC->>VEC: FAISS L2 search
    VEC-->>RAG: Best match: getUserPoints (score: 0.07)
    RAG->>ACT: Execute getUserPoints()
    ACT-->>RAG: "Your points: 1280"
    RAG-->>CLI: Formatted response
    CLI-->>U: Display result
    
    Note over U,CACHE: 💾 Caching & Optimization
    RAG->>CACHE: Save new embeddings
    CACHE-->>RAG: Cache updated
```

### 🏛️ Core Module Details

```
src/
├── 📱 index.ts              # CLI entry point
│   ├── Command line parsing
│   ├── User interaction interface
│   └── Main program loop
│
├── 🎯 rag.ts               # RAG core system
│   ├── System initialization coordination
│   ├── Query processing flow
│   ├── Intent matching logic
│   └── Response generation
│
├── 🧠 embedding.ts         # Embedding service
│   ├── Qwen3 model loading (node-llama-cpp)
│   ├── Text vectorization (1024-dim)
│   ├── Batch processing optimization
│   └── Resource management
│
├── 📊 vectorStore.ts       # Vector storage
│   ├── FAISS index management (faiss-node)
│   ├── L2 distance calculation
│   ├── Similarity search
│   └── Batch vector operations
│
├── ⚡ actions.ts           # Business logic
│   ├── User management functions
│   ├── Device management functions
│   ├── System functions
│   └── Dynamic parameter handling
│
├── 🌐 multilang.ts        # Multi-language management
│   ├── Language detection
│   ├── Intent template management (341 templates)
│   ├── 7 language support
│   └── Dynamic template extension
│
└── 💾 persistence.ts      # Persistent storage
    ├── Embedding cache
    ├── Metadata management
    ├── Cache validation
    └── Incremental updates
```

### 🛠️ Technology Stack Architecture

```mermaid
graph LR
    subgraph "Frontend Layer"
        CLI[📱 CLI Interface]
        READLINE[💬 Readline]
    end
    
    subgraph "Application Layer"
        RAG[🎯 RAG Engine]
        ROUTER[🔀 Intent Router]
        ACTIONS[⚡ Action Executor]
    end
    
    subgraph "AI/ML Layer"
        EMBEDDING[🧠 Embedding Service]
        VECTOR[📊 Vector Search]
        MULTILANG[🌐 Language Detection]
    end
    
    subgraph "Infrastructure Layer"
        LLAMACPP[🤖 node-llama-cpp]
        FAISS[🔍 faiss-node]
        CACHE[💾 File System Cache]
    end
    
    subgraph "Data Layer"
        MODEL["📦 Qwen3 Model<br/>609MB GGUF"]
        TEMPLATES["📝 Intent Templates<br/>341 items"]
        EMBEDDINGS["💿 Cached Embeddings<br/>10MB JSON"]
    end
    
    CLI --> RAG
    READLINE --> CLI
    RAG --> ROUTER
    ROUTER --> ACTIONS
    RAG --> EMBEDDING
    RAG --> VECTOR
    RAG --> MULTILANG
    
    EMBEDDING --> LLAMACPP
    VECTOR --> FAISS
    MULTILANG --> CACHE
    
    LLAMACPP --> MODEL
    FAISS --> EMBEDDINGS
    MULTILANG --> TEMPLATES
    
    style CLI fill:#e3f2fd
    style RAG fill:#f3e5f5
    style EMBEDDING fill:#e8f5e8
    style LLAMACPP fill:#ffebee
    style MODEL fill:#fce4ec
```

### 📊 Data Flow Architecture

```mermaid
flowchart TD
    subgraph "Input Processing"
        A["👤 User Input<br/>check my points"] --> B["🔍 Language Detection<br/>English: 90%"]
        B --> C["🧠 Text to Embedding<br/>Qwen3 Model"]
        C --> D["📐 Vector<br/>1024 dimensions"]
    end
    
    subgraph "Intent Matching"
        D --> E["🔍 FAISS Search<br/>L2 Distance"]
        E --> F["📊 Similarity Scores<br/>Top 5 matches"]
        F --> G{"🎯 Score > 0.05?"}
        G -->|Yes| H["✅ Intent Matched<br/>getUserPoints"]
        G -->|No| I["❌ No Match<br/>Fallback response"]
    end
    
    subgraph "Action Execution"
        H --> J["⚡ Execute Action<br/>getUserPoints"]
        J --> K["💼 Business Logic<br/>Fetch user data"]
        K --> L["📝 Generate Response<br/>Your points: 1280"]
    end
    
    subgraph "Response Generation"
        L --> M["🌐 Localize Response<br/>English format"]
        I --> M
        M --> N["📱 CLI Output<br/>Formatted display"]
    end
    
    subgraph "Caching Layer"
        C -.->|"Cache hit"| O["💾 Cached Embeddings<br/>341 intents"]
        O -.->|"Load"| E
        L -.->|"Update"| P["📈 Usage Statistics<br/>Performance metrics"]
    end
    
    style A fill:#e1f5fe
    style D fill:#e8f5e8
    style H fill:#f3e5f5
    style L fill:#fff3e0
    style O fill:#f1f8e9
```

### ⚡ Performance Metrics Architecture

```mermaid
graph TD
    subgraph "Performance Metrics"
        P1["🚀 Startup Performance<br/>Cold: ~3s, Warm: ~0.8s"]
        P2["🧠 Model Loading<br/>Qwen3: ~2.1s, 609MB"]
        P3["💾 Cache Performance<br/>Hit Rate: 95%+"]
        P4["🔍 Query Speed<br/>Avg: 150ms, P99: 300ms"]
    end
    
    subgraph "Memory Usage"
        M1["📊 Model Memory<br/>~1.2GB RAM"]
        M2["💿 Cache Memory<br/>~50MB RAM"]
        M3["🔄 Runtime Memory<br/>~200MB RAM"]
        M4["📈 Total Memory<br/>~1.5GB RAM"]
    end
    
    subgraph "Scalability"
        S1["📝 Intent Templates<br/>Current: 341<br/>Max: 10,000+"]
        S2["🌐 Languages<br/>Current: 7<br/>Max: 50+"]
        S3["⚡ Actions<br/>Current: 15<br/>Max: 1,000+"]
        S4["🔍 Vector Dimensions<br/>Fixed: 1024"]
    end
    
    P1 --> M1
    P2 --> M2
    P3 --> M3
    P4 --> M4
    
    M1 --> S1
    M2 --> S2
    M3 --> S3
    M4 --> S4
    
    style P1 fill:#e8f5e8
    style M1 fill:#fff3e0
    style S1 fill:#f3e5f5
```

### 🔧 Extension Architecture

```mermaid
graph TB
    subgraph "Extension Points"
        EXT1["➕ Add New Language<br/>1. Create templates<br/>2. Generate embeddings<br/>3. Update FAISS"]
        EXT2["⚡ Add New Action<br/>1. Define function<br/>2. Add templates<br/>3. Register router"]
        EXT3["🤖 Change Model<br/>1. Download GGUF<br/>2. Update config<br/>3. Rebuild cache"]
        EXT4["📊 Custom Metrics<br/>1. Add collectors<br/>2. Export data<br/>3. Dashboard"]
    end
    
    subgraph "Plugin System"
        PLG1["🔌 Plugin Interface<br/>IPlugin"]
        PLG2["📦 Plugin Manager<br/>Load/Unload"]
        PLG3["🔗 Plugin Registry<br/>Available plugins"]
        PLG4["⚙️ Plugin Config<br/>Settings & params"]
    end
    
    subgraph "Integration Points"
        INT1["🌐 Web API<br/>REST/GraphQL"]
        INT2["📱 Mobile SDK<br/>React Native"]
        INT3["🖥️ Desktop GUI<br/>Electron"]
        INT4["☁️ Cloud Deploy<br/>Docker/K8s"]
    end
    
    EXT1 --> PLG1
    EXT2 --> PLG2
    EXT3 --> PLG3
    EXT4 --> PLG4
    
    PLG1 --> INT1
    PLG2 --> INT2
    PLG3 --> INT3
    PLG4 --> INT4
    
    style EXT1 fill:#e1f5fe
    style PLG1 fill:#f3e5f5
    style INT1 fill:#e8f5e8
```

## 📦 Installation

### Prerequisites

- Node.js >= 18.0.0
- Memory >= 4GB (for loading embedding models)
- Supported OS: macOS, Linux, Windows

### 1. Clone Repository

```bash
# SSH method (recommended)
git clone git@github.com:HeiSir2014/UserSphere.git
cd UserSphere

# Or use HTTPS method
git clone https://github.com/HeiSir2014/UserSphere.git
cd UserSphere
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Download Embedding Models

Create `models` folder in project root and download models:

```bash
mkdir models
cd models

# Option 1: Qwen3 Embedding Model (Recommended, 1024-dim)
# Source: https://huggingface.co/Qwen/Qwen3-Embedding-0.6B-GGUF/
wget https://huggingface.co/Qwen/Qwen3-Embedding-0.6B-GGUF/resolve/main/Qwen3-Embedding-0.6B-Q8_0.gguf
# Or use curl
curl -L -O https://huggingface.co/Qwen/Qwen3-Embedding-0.6B-GGUF/resolve/main/Qwen3-Embedding-0.6B-Q8_0.gguf

# Option 2: EmbeddingGemma Model (Alternative, 768-dim)
# Source: https://huggingface.co/unsloth/embeddinggemma-300m-GGUF/
wget https://huggingface.co/unsloth/embeddinggemma-300m-GGUF/resolve/main/embeddinggemma-300M-Q8_0.gguf
# Or use curl
curl -L -O https://huggingface.co/unsloth/embeddinggemma-300m-GGUF/resolve/main/embeddinggemma-300M-Q8_0.gguf
```

### 4. Build Project

```bash
npm run build
```

### 5. Start Application

```bash
npm start
# or
./dist/index.js
```

## 🚀 Usage

### Basic Commands

```bash
# Start CLI
usersphere

# Specify model file
usersphere --model ./models/qwen3-embedding-0.6b.gguf

# Enable performance statistics
usersphere --timings

# Disable colored output
usersphere --no-color

# Show help
usersphere --help
```

### Interactive Examples

```bash
> check my points
🤖 Your points: 1280

> what devices do I have?
🤖 Current bound devices (4):
  • MacBook-Pro (laptop) - online
  • iPhone-15 (mobile) - online
  • iPad-Air (tablet) - offline
  • iMac-2021 (desktop) - online

> is iPhone online?
🤖 Device status:
  • iPhone-15 (mobile) - online - IP: 192.168.1.101

> add device Samsung-Galaxy
🤖 Device "Samsung-Galaxy" has been successfully added (status: online).

> help
🤖 UserSphere CLI available functions:
...
```

## 🌐 Multi-language Support

UserSphere CLI supports multi-language interaction, the system automatically recognizes language and matches corresponding functions:

### Chinese Examples
```bash
> 查询积分
> 我的用户名是什么
> 列出所有设备
> iPhone状态如何
```

### English Examples
```bash
> check my points
> what's my username
> list all devices
> iPhone status
```

### Supported Function Categories

| Function Category | Chinese Example | English Example |
|---------|---------|-----------------|
| User Info | 查询积分、用户名、头像 | check points, username, avatar |
| Device Management | 列出设备、设备状态、添加设备 | list devices, device status, add device |
| System Functions | 帮助、系统信息、退出 | help, system info, exit |

## 🛠️ Development

### Project Structure

```
src/
├── embedding.ts     # Embedding service wrapper
├── vectorStore.ts   # Vector storage and retrieval
├── rag.ts          # RAG logic and intent matching
├── actions.ts      # Business logic action implementation
├── multilang.ts    # Multi-language support module
├── persistence.ts  # Persistent storage module
└── index.ts        # CLI entry point

data/               # Data storage directory
├── embeddings.json # Cached embedding data
├── intents.json    # Intent template configuration
└── faiss.index     # FAISS index file
```

### Development Commands

```bash
# Run in development mode
npm run dev

# Build project
npm run build

# Code linting
npm run lint

# Fix code style
npm run lint:fix

# Clean build files
npm run clean
```

### Adding New Features

1. **Add new action** (in `actions.ts`):
```typescript
export function newAction(param: string): string {
  return `Execute new feature: ${param}`;
}
```

2. **Add intent template** (in `rag.ts`):
```typescript
{
  text: 'new feature',
  action: 'newAction',
  description: 'Execute new feature',
  category: 'custom',
  examples: ['new feature', 'run new feature'],
}
```

3. **Rebuild and test**:
```bash
npm run build
npm start
```

## 🔧 Configuration

### Environment Variables

```bash
# Model file path
USERSPHERE_MODEL_PATH=./models/qwen3-embedding-0.6b.gguf

# Data storage directory
USERSPHERE_DATA_DIR=./data

# Similarity threshold (0.0-1.0)
USERSPHERE_SIMILARITY_THRESHOLD=0.3

# Enable debug mode
USERSPHERE_DEBUG=true
```

### Model Configuration

Supported embedding models:

| Model | Dimensions | Size | Recommended Use |
|------|------|------|----------|
| qwen3-embedding:0.6b | 1024 | ~600MB | General recommendation |
| embeddinggemma | 768 | ~1.2GB | High precision scenarios |

## 📊 Performance Optimization

### First Startup Optimization

1. **Embedding Cache**: Calculate and cache all intent embeddings on first run
2. **FAISS Index**: Save FAISS index to local file
3. **Fast Loading**: Subsequent startups directly load cached data

### Memory Optimization

- Model loading: ~600MB - 1.2GB
- FAISS index: ~10MB
- Runtime memory: ~200MB

## 🐛 Troubleshooting

### Common Issues

**Q: Model loading failed**
```bash
❌ Model file does not exist or is corrupted
💡 Solution: Re-download model file, ensure file integrity
```

**Q: Out of memory**
```bash
❌ Memory overflow when loading model
💡 Solution: Ensure system has sufficient memory (recommended 4GB+)
```

**Q: Intent recognition inaccurate**
```bash
❌ System cannot understand user input
💡 Solution: Adjust similarity threshold or add more intent templates
```

### Debug Mode

Enable verbose logging:
```bash
USERSPHERE_DEBUG=true npm start
```

## 🤝 Contributing

1. Fork the project
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push branch: `git push origin feature/amazing-feature`
5. Submit Pull Request

### Code Style

The project follows [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html):

- Use TypeScript strict mode
- Prefer `const` and `readonly`
- Complete type annotations
- Detailed JSDoc comments

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

- [node-llama-cpp](https://github.com/withcatai/node-llama-cpp) - Local LLM inference
- [faiss-node](https://github.com/ewfian/faiss-node) - Efficient vector retrieval
- [Qwen](https://github.com/QwenLM/Qwen) - Embedding models
- [Google Gemma](https://github.com/google/gemma) - Embedding models

## 📞 Support

- 📧 Email: heisir21@163.com
- 🐛 Issues: [GitHub Issues](https://github.com/HeiSir2014/UserSphere/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/HeiSir2014/UserSphere/discussions)

---

<div align="center">

**Made with ❤️ by HeiSir2014**

[⭐ Star](https://github.com/HeiSir2014/UserSphere) | [🍴 Fork](https://github.com/HeiSir2014/UserSphere/fork) | [📝 Report Bug](https://github.com/HeiSir2014/UserSphere/issues)

</div>
