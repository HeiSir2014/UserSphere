#!/usr/bin/env node

/**
 * @fileoverview Main CLI entry point for UserSphere.
 * Provides an interactive command-line interface with natural language processing.
 */

import * as readline from 'readline';
import * as path from 'path';
import * as fs from 'fs';
import {fileURLToPath} from 'url';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { RAGSystem, createDefaultRAGSystem } from './rag.js';
import * as Actions from './actions.js';

/**
 * CLI configuration interface.
 */
interface CLIConfig {
  readonly modelPath?: string;
  readonly welcomeMessage?: string;
  readonly prompt?: string;
  readonly enableColors?: boolean;
  readonly showTimings?: boolean;
}

/**
 * ANSI color codes for terminal output.
 */
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
} as const;

/**
 * UserSphere CLI class managing the interactive interface.
 */
class UserSphereCLI {
  private readonly rag: RAGSystem;
  private readonly rl: readline.Interface;
  private readonly config: Required<CLIConfig>;
  private isRunning: boolean = false;

  /**
   * Creates a new CLI instance.
   * @param rag - Initialized RAG system
   * @param config - CLI configuration options
   */
  constructor(rag: RAGSystem, config: CLIConfig = {}) {
    this.rag = rag;
    this.config = {
      modelPath: config.modelPath ?? './models/embeddinggemma.gguf',
      welcomeMessage: config.welcomeMessage ?? 'UserSphere CLI',
      prompt: config.prompt ?? '> ',
      enableColors: config.enableColors ?? true,
      showTimings: config.showTimings ?? false,
    };

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: this.formatPrompt(this.config.prompt),
      completer: this.completer.bind(this),
    });

    this.setupEventHandlers();
  }

  /**
   * Formats text with colors if enabled.
   * @param text - Text to format
   * @param color - Color to apply
   * @returns Formatted text
   */
  private colorize(text: string, color: keyof typeof colors): string {
    if (!this.config.enableColors) {
      return text;
    }
    return `${colors[color]}${text}${colors.reset}`;
  }

  /**
   * Formats the CLI prompt.
   * @param prompt - Base prompt text
   * @returns Formatted prompt
   */
  private formatPrompt(prompt: string): string {
    return this.colorize(prompt, 'cyan');
  }

  /**
   * Provides auto-completion suggestions for user input.
   * @param line - Current input line
   * @returns Completion suggestions
   */
  private completer(line: string): [string[], string] {
    const completions = [
      '查询积分', '查询用户名', '查询头像', '查询座右铭', '查询资料',
      '列出设备', '在线设备', '设备状态', '添加设备', '删除设备',
      '帮助', '系统信息', '退出',
      'help', 'exit', 'quit',
    ];

    const hits = completions.filter(completion => 
      completion.toLowerCase().startsWith(line.toLowerCase())
    );

    return [hits.length ? hits : completions, line];
  }

  /**
   * Sets up event handlers for the readline interface.
   */
  private setupEventHandlers(): void {
    this.rl.on('line', async (input: string) => {
      await this.handleUserInput(input);
    });

    this.rl.on('close', () => {
      this.handleExit();
    });

    // Handle Ctrl+C
    this.rl.on('SIGINT', () => {
      console.log('\n');
      this.rl.question(
        this.colorize('确定要退出吗? (y/N): ', 'yellow'),
        (answer) => {
          if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
            // Remove the close listener to avoid double cleanup
            this.rl.removeAllListeners('close');
            this.handleExit();
          } else {
            console.log(this.colorize('继续使用 UserSphere CLI...', 'green'));
            this.rl.prompt();
          }
        }
      );
    });
  }

  /**
   * Handles user input and generates responses.
   * @param input - User input string
   */
  private async handleUserInput(input: string): Promise<void> {
    const trimmedInput = input.trim();

    // Handle empty input
    if (!trimmedInput) {
      this.rl.prompt();
      return;
    }

    // Check for direct exit commands
    if (['exit', 'quit', '退出', '再见'].includes(trimmedInput.toLowerCase())) {
      this.handleExit();
      return;
    }

    try {
      // Process the query through RAG system
      const result = await this.rag.query(trimmedInput);

      // Display the response
      this.displayResponse(result.response, result);

      // Handle exit command response
      if (result.matchedIntent?.action === 'exitProgram') {
        setTimeout(() => this.handleExit(), 1000);
        return;
      }

    } catch (error) {
      console.error(this.colorize(
        `❌ 处理请求时发生错误: ${error instanceof Error ? error.message : String(error)}`,
        'red'
      ));
    }

    this.rl.prompt();
  }

  /**
   * Displays the system response with formatting.
   * @param response - Response text to display
   * @param result - Full RAG result for additional information
   */
  private displayResponse(response: string, result?: any): void {
    // Display main response
    console.log(this.colorize('🤖 ', 'blue') + response);

    // Show additional information if enabled
    if (this.config.showTimings && result?.executionTime) {
      console.log(this.colorize(
        `   ⏱️  处理时间: ${result.executionTime}ms`,
        'dim'
      ));
    }

    if (this.config.showTimings && result?.confidence) {
      const confidencePercent = Math.round(result.confidence * 100);
      console.log(this.colorize(
        `   📊 匹配度: ${confidencePercent}%`,
        'dim'
      ));
    }
  }

  /**
   * Displays the welcome message and system information.
   */
  private displayWelcome(): void {
    const welcome = `
${this.colorize('╔══════════════════════════════════════════════════════════════╗', 'cyan')}
${this.colorize('║', 'cyan')}                    ${this.colorize('UserSphere CLI', 'bright')}                        ${this.colorize('║', 'cyan')}
${this.colorize('║', 'cyan')}          ${this.colorize('智能用户和设备管理命令行工具', 'white')}                  ${this.colorize('║', 'cyan')}
${this.colorize('╚══════════════════════════════════════════════════════════════╝', 'cyan')}

${this.colorize('🚀 系统已就绪！您可以使用自然语言与我交互。', 'green')}

${this.colorize('💡 常用功能:', 'yellow')}
  • 用户信息: ${this.colorize('"查询积分"', 'white')} ${this.colorize('"我的用户名"', 'white')} ${this.colorize('"个人资料"', 'white')}
  • 设备管理: ${this.colorize('"列出设备"', 'white')} ${this.colorize('"在线设备"', 'white')} ${this.colorize('"iPhone状态"', 'white')}
  • 系统功能: ${this.colorize('"帮助"', 'white')} ${this.colorize('"系统信息"', 'white')} ${this.colorize('"退出"', 'white')}

${this.colorize('📝 提示: 输入 "帮助" 查看完整功能列表', 'dim')}
${this.colorize('🔄 按 Ctrl+C 可以安全退出', 'dim')}
`;

    console.log(welcome);
  }

  /**
   * Displays system statistics.
   */
  private displayStats(): void {
    const stats = this.rag.getStats();
    const userInfo = Actions.mockUser;
    const deviceInfo = Actions.mockDevices;

    console.log(this.colorize('\n📊 系统状态:', 'cyan'));
    console.log(`  • RAG系统: ${stats.isInitialized ? '✅ 已初始化' : '❌ 未初始化'}`);
    console.log(`  • 意图模板: ${stats.totalTemplates} 个`);
    console.log(`  • 向量索引: ${stats.totalIntents} 个`);
    console.log(`  • 当前用户: ${userInfo.username} (积分: ${userInfo.points})`);
    console.log(`  • 绑定设备: ${deviceInfo.length} 个 (${deviceInfo.filter(d => d.online).length} 在线)`);
    console.log();
  }

  /**
   * Starts the CLI interface.
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      console.log(this.colorize('CLI 已在运行中...', 'yellow'));
      return;
    }

    try {
      this.isRunning = true;
      this.displayWelcome();
      
      if (this.config.showTimings) {
        this.displayStats();
      }

      this.rl.prompt();

    } catch (error) {
      console.error(this.colorize(
        `❌ 启动 CLI 时发生错误: ${error instanceof Error ? error.message : String(error)}`,
        'red'
      ));
      process.exit(1);
    }
  }

  /**
   * Handles application exit.
   */
  private handleExit(): void {
    if (!this.isRunning) {
      return;
    }

    // Set flag immediately to prevent multiple calls
    this.isRunning = false;

    console.log(this.colorize('\n👋 感谢使用 UserSphere CLI，再见！', 'green'));
    
    // Clean up resources
    try {
      this.rag.dispose();
    } catch (error) {
      console.error(this.colorize('清理资源时发生错误:', 'red'), error);
    }

    this.rl.close();
    process.exit(0);
  }

  /**
   * Gets the current CLI configuration.
   * @returns CLI configuration object
   */
  public getConfig(): Required<CLIConfig> {
    return { ...this.config };
  }
}

/**
 * Finds the embedding model file in common locations.
 * @returns Path to the model file or null if not found
 */
function findModelFile(): string | null {
  const commonPaths = [
    './models/Qwen3-Embedding-0.6B-Q8_0.gguf',
    './models/embeddinggemma-300M-Q8_0.gguf',
    './models/embeddinggemma.gguf',
    './models/qwen3-embedding-0.6b.gguf',
    path.join(__dirname, '../models/Qwen3-Embedding-0.6B-Q8_0.gguf'),
    path.join(__dirname, '../models/embeddinggemma-300M-Q8_0.gguf'),
    path.join(__dirname, '../models/embeddinggemma.gguf'),
    path.join(__dirname, '../models/qwen3-embedding-0.6b.gguf'),
    path.join(process.cwd(), 'models/Qwen3-Embedding-0.6B-Q8_0.gguf'),
    path.join(process.cwd(), 'models/embeddinggemma-300M-Q8_0.gguf'),
    path.join(process.cwd(), 'models/embeddinggemma.gguf'),
    path.join(process.cwd(), 'models/qwen3-embedding-0.6b.gguf'),
  ];

  for (const modelPath of commonPaths) {
    if (fs.existsSync(modelPath)) {
      return path.resolve(modelPath);
    }
  }

  return null;
}

/**
 * Parses command line arguments.
 * @returns Parsed CLI configuration
 */
function parseArguments(): CLIConfig {
  const args = process.argv.slice(2);
  const config: any = {};

  // Debug: log all arguments
  console.log('Debug - process.argv:', process.argv);
  console.log('Debug - args:', args);

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (!arg) continue;
    
    switch (arg) {
      case '--model':
      case '-m':
        config.modelPath = args[++i];
        break;
      case '--no-color':
        config.enableColors = false;
        break;
      case '--timings':
      case '-t':
        config.showTimings = true;
        break;
      case '--help':
      case '-h':
        console.log(`
UserSphere CLI - 智能用户和设备管理工具

用法: usersphere [选项]

选项:
  -m, --model <path>    指定 embedding 模型文件路径
  --no-color           禁用彩色输出
  -t, --timings        显示性能统计信息
  -h, --help           显示此帮助信息

示例:
  usersphere
  usersphere --model ./models/qwen3-embedding-0.6b.gguf
  usersphere --timings --no-color
`);
        process.exit(0);
        break;
      default:
        if (arg.startsWith('-')) {
          console.error(`未知选项: ${arg}`);
          process.exit(1);
        }
        break;
    }
  }

  return config;
}

/**
 * Main application entry point.
 */
async function main(): Promise<void> {
  try {
    // Parse command line arguments
    const cliConfig = parseArguments();

    // Find model file
    const modelPath = cliConfig.modelPath || findModelFile();
    
    if (!modelPath) {
      console.error(`
❌ 未找到 embedding 模型文件！

请将模型文件放置在以下位置之一:
  • ./models/Qwen3-Embedding-0.6B-Q8_0.gguf
  • ./models/embeddinggemma-300M-Q8_0.gguf

或使用 --model 参数指定模型文件路径:
  usersphere --model /path/to/your/model.gguf

推荐模型下载:
  • Qwen3 Embedding (384维): 
    wget https://huggingface.co/Qwen/Qwen3-Embedding-0.6B-GGUF/resolve/main/Qwen3-Embedding-0.6B-Q8_0.gguf
  • EmbeddingGemma (768维):
    wget https://huggingface.co/unsloth/embeddinggemma-300m-GGUF/resolve/main/embeddinggemma-300M-Q8_0.gguf
`);
      process.exit(1);
    }

    if (!fs.existsSync(modelPath)) {
      console.error(`❌ 模型文件不存在: ${modelPath}`);
      process.exit(1);
    }

    console.log('🔄 正在初始化 UserSphere CLI...');
    console.log(`📁 加载模型: ${path.basename(modelPath)}`);

    // Initialize RAG system
    const rag = await createDefaultRAGSystem(modelPath);

    // Create and start CLI
    const cli = new UserSphereCLI(rag, cliConfig);
    await cli.start();

  } catch (error) {
    console.error(`❌ 启动失败: ${error instanceof Error ? error.message : String(error)}`);
    
    if (error instanceof Error && error.message.includes('model')) {
      console.error(`
💡 模型加载失败的常见原因:
  • 模型文件损坏或格式不正确
  • 内存不足 (embedding 模型通常需要 2-4GB RAM)
  • 模型路径包含特殊字符
  • 权限不足

请检查模型文件并重试。
`);
    }
    
    process.exit(1);
  }
}

// Handle uncaught exceptions gracefully
process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获的异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ 未处理的 Promise 拒绝:', reason);
  process.exit(1);
});

main().catch((error) => {
  console.error('❌ 应用程序启动失败:', error);
  process.exit(1);
});
