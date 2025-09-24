/**
 * @fileoverview Multi-language support module for UserSphere CLI.
 * Manages intent templates in multiple languages and provides language detection.
 */

import * as Actions from './actions';

/**
 * Supported languages in the system.
 */
export type SupportedLanguage = 'zh' | 'en' | 'ja' | 'ko' | 'es' | 'fr' | 'de';

/**
 * Multi-language intent template structure.
 */
export interface MultiLangIntentTemplate {
  readonly id: string;
  readonly action: Actions.ActionName;
  readonly description: Record<SupportedLanguage, string>;
  readonly category: string;
  readonly templates: Record<SupportedLanguage, readonly string[]>;
  readonly parameters?: readonly string[];
  readonly priority?: number;
}

/**
 * Language detection result.
 */
export interface LanguageDetectionResult {
  readonly language: SupportedLanguage;
  readonly confidence: number;
  readonly detectedPatterns: readonly string[];
}

/**
 * Multi-language intent templates for the UserSphere system.
 */
export const multiLangIntentTemplates: readonly MultiLangIntentTemplate[] = [
  // ==================== USER INFORMATION ====================
  {
    id: 'get_user_points',
    action: 'getUserPoints',
    description: {
      zh: '查询用户当前积分余额',
      en: 'Query user current points balance',
      ja: 'ユーザーの現在のポイント残高を照会',
      ko: '사용자 현재 포인트 잔액 조회',
      es: 'Consultar saldo de puntos actual del usuario',
      fr: 'Interroger le solde de points actuel de l\'utilisateur',
      de: 'Aktuellen Punktestand des Benutzers abfragen',
    },
    category: 'user',
    templates: {
      zh: ['查询积分', '我的积分', '积分余额', '查看积分', '告诉我账户积分', '积分查询', '积分是多少'],
      en: ['check points', 'my points', 'points balance', 'show points', 'account points', 'points query', 'how many points'],
      ja: ['ポイント確認', '私のポイント', 'ポイント残高', 'ポイント表示', 'アカウントポイント'],
      ko: ['포인트 확인', '내 포인트', '포인트 잔액', '포인트 표시', '계정 포인트'],
      es: ['verificar puntos', 'mis puntos', 'saldo de puntos', 'mostrar puntos'],
      fr: ['vérifier les points', 'mes points', 'solde de points', 'afficher les points'],
      de: ['Punkte prüfen', 'meine Punkte', 'Punktestand', 'Punkte anzeigen'],
    },
    priority: 1,
  },
  {
    id: 'get_username',
    action: 'getUsername',
    description: {
      zh: '查询用户名信息',
      en: 'Query username information',
      ja: 'ユーザー名情報を照会',
      ko: '사용자명 정보 조회',
      es: 'Consultar información del nombre de usuario',
      fr: 'Interroger les informations du nom d\'utilisateur',
      de: 'Benutzername-Informationen abfragen',
    },
    category: 'user',
    templates: {
      zh: ['查询用户名', '我的用户名', '用户名是什么', '查看用户名', '显示用户名'],
      en: ['check username', 'my username', 'what is my username', 'show username', 'display username'],
      ja: ['ユーザー名確認', '私のユーザー名', 'ユーザー名表示'],
      ko: ['사용자명 확인', '내 사용자명', '사용자명 표시'],
      es: ['verificar nombre de usuario', 'mi nombre de usuario', 'mostrar nombre de usuario'],
      fr: ['vérifier nom d\'utilisateur', 'mon nom d\'utilisateur', 'afficher nom d\'utilisateur'],
      de: ['Benutzername prüfen', 'mein Benutzername', 'Benutzername anzeigen'],
    },
    priority: 1,
  },
  {
    id: 'get_user_profile',
    action: 'getUserProfile',
    description: {
      zh: '查询完整用户档案信息',
      en: 'Query complete user profile information',
      ja: '完全なユーザープロファイル情報を照会',
      ko: '완전한 사용자 프로필 정보 조회',
      es: 'Consultar información completa del perfil de usuario',
      fr: 'Interroger les informations complètes du profil utilisateur',
      de: 'Vollständige Benutzerprofilinformationen abfragen',
    },
    category: 'user',
    templates: {
      zh: ['用户资料', '个人信息', '我的档案', '用户档案', '个人资料', '完整信息'],
      en: ['user profile', 'personal info', 'my profile', 'account info', 'personal information', 'complete info'],
      ja: ['ユーザープロファイル', '個人情報', '私のプロファイル', 'アカウント情報'],
      ko: ['사용자 프로필', '개인 정보', '내 프로필', '계정 정보'],
      es: ['perfil de usuario', 'información personal', 'mi perfil', 'información de cuenta'],
      fr: ['profil utilisateur', 'informations personnelles', 'mon profil', 'informations de compte'],
      de: ['Benutzerprofil', 'persönliche Informationen', 'mein Profil', 'Kontoinformationen'],
    },
    priority: 2,
  },

  // ==================== DEVICE MANAGEMENT ====================
  {
    id: 'list_devices',
    action: 'listDevices',
    description: {
      zh: '显示所有绑定设备',
      en: 'Display all bound devices',
      ja: 'すべてのバインドされたデバイスを表示',
      ko: '모든 바인딩된 장치 표시',
      es: 'Mostrar todos los dispositivos vinculados',
      fr: 'Afficher tous les appareils liés',
      de: 'Alle gebundenen Geräte anzeigen',
    },
    category: 'device',
    templates: {
      zh: ['列出设备', '我的设备', '设备列表', '所有设备', '绑定的设备', '查看设备'],
      en: ['list devices', 'my devices', 'device list', 'all devices', 'bound devices', 'show devices'],
      ja: ['デバイス一覧', '私のデバイス', 'デバイスリスト', 'すべてのデバイス'],
      ko: ['장치 목록', '내 장치', '장치 리스트', '모든 장치'],
      es: ['listar dispositivos', 'mis dispositivos', 'lista de dispositivos', 'todos los dispositivos'],
      fr: ['lister appareils', 'mes appareils', 'liste d\'appareils', 'tous les appareils'],
      de: ['Geräte auflisten', 'meine Geräte', 'Geräteliste', 'alle Geräte'],
    },
    priority: 1,
  },
  {
    id: 'list_online_devices',
    action: 'listOnlineDevices',
    description: {
      zh: '显示当前在线的设备',
      en: 'Display currently online devices',
      ja: '現在オンラインのデバイスを表示',
      ko: '현재 온라인인 장치 표시',
      es: 'Mostrar dispositivos actualmente en línea',
      fr: 'Afficher les appareils actuellement en ligne',
      de: 'Derzeit online befindliche Geräte anzeigen',
    },
    category: 'device',
    templates: {
      zh: ['在线设备', '哪些设备在线', '在线的设备', '活跃设备', '在线设备列表'],
      en: ['online devices', 'which devices online', 'devices online', 'active devices', 'online device list'],
      ja: ['オンラインデバイス', 'オンラインのデバイス', 'アクティブデバイス'],
      ko: ['온라인 장치', '온라인인 장치', '활성 장치'],
      es: ['dispositivos en línea', 'dispositivos activos', 'qué dispositivos están en línea'],
      fr: ['appareils en ligne', 'appareils actifs', 'quels appareils sont en ligne'],
      de: ['Online-Geräte', 'aktive Geräte', 'welche Geräte sind online'],
    },
    priority: 1,
  },
  {
    id: 'check_device_status',
    action: 'checkDeviceStatus',
    description: {
      zh: '查询特定设备的在线状态',
      en: 'Query specific device online status',
      ja: '特定のデバイスのオンライン状態を照会',
      ko: '특정 장치의 온라인 상태 조회',
      es: 'Consultar el estado en línea de un dispositivo específico',
      fr: 'Interroger le statut en ligne d\'un appareil spécifique',
      de: 'Online-Status eines bestimmten Geräts abfragen',
    },
    category: 'device',
    templates: {
      zh: ['设备状态', 'iPhone状态', 'MacBook在线吗', '检查设备', '设备是否在线', '查询设备状态'],
      en: ['device status', 'iPhone status', 'is MacBook online', 'check device', 'device online status', 'query device status'],
      ja: ['デバイス状態', 'iPhoneの状態', 'MacBookはオンライン', 'デバイス確認'],
      ko: ['장치 상태', 'iPhone 상태', 'MacBook 온라인인가', '장치 확인'],
      es: ['estado del dispositivo', 'estado de iPhone', '¿MacBook está en línea?', 'verificar dispositivo'],
      fr: ['statut de l\'appareil', 'statut iPhone', 'MacBook est-il en ligne', 'vérifier appareil'],
      de: ['Gerätestatus', 'iPhone-Status', 'ist MacBook online', 'Gerät prüfen'],
    },
    parameters: ['deviceName'],
    priority: 1,
  },
  {
    id: 'add_device',
    action: 'addDevice',
    description: {
      zh: '绑定新设备到账户',
      en: 'Bind new device to account',
      ja: '新しいデバイスをアカウントにバインド',
      ko: '계정에 새 장치 바인딩',
      es: 'Vincular nuevo dispositivo a la cuenta',
      fr: 'Lier un nouvel appareil au compte',
      de: 'Neues Gerät an Konto binden',
    },
    category: 'device',
    templates: {
      zh: ['添加设备', '绑定设备', '添加新设备', '连接设备', '注册设备'],
      en: ['add device', 'bind device', 'add new device', 'connect device', 'register device'],
      ja: ['デバイス追加', 'デバイスバインド', '新しいデバイス追加', 'デバイス接続'],
      ko: ['장치 추가', '장치 바인딩', '새 장치 추가', '장치 연결'],
      es: ['agregar dispositivo', 'vincular dispositivo', 'agregar nuevo dispositivo', 'conectar dispositivo'],
      fr: ['ajouter appareil', 'lier appareil', 'ajouter nouvel appareil', 'connecter appareil'],
      de: ['Gerät hinzufügen', 'Gerät binden', 'neues Gerät hinzufügen', 'Gerät verbinden'],
    },
    parameters: ['deviceName'],
    priority: 1,
  },
  {
    id: 'remove_device',
    action: 'removeDevice',
    description: {
      zh: '从账户解绑设备',
      en: 'Unbind device from account',
      ja: 'アカウントからデバイスをアンバインド',
      ko: '계정에서 장치 언바인딩',
      es: 'Desvincular dispositivo de la cuenta',
      fr: 'Délier l\'appareil du compte',
      de: 'Gerät von Konto entbinden',
    },
    category: 'device',
    templates: {
      zh: ['删除设备', '解绑设备', '移除设备', '取消绑定', '断开设备'],
      en: ['remove device', 'unbind device', 'delete device', 'disconnect device', 'unregister device'],
      ja: ['デバイス削除', 'デバイスアンバインド', 'デバイス除去', 'デバイス切断'],
      ko: ['장치 제거', '장치 언바인딩', '장치 삭제', '장치 연결 해제'],
      es: ['eliminar dispositivo', 'desvincular dispositivo', 'borrar dispositivo', 'desconectar dispositivo'],
      fr: ['supprimer appareil', 'délier appareil', 'effacer appareil', 'déconnecter appareil'],
      de: ['Gerät entfernen', 'Gerät entbinden', 'Gerät löschen', 'Gerät trennen'],
    },
    parameters: ['deviceName'],
    priority: 1,
  },

  // ==================== UTILITY FUNCTIONS ====================
  {
    id: 'get_help',
    action: 'getHelp',
    description: {
      zh: '显示系统帮助信息',
      en: 'Display system help information',
      ja: 'システムヘルプ情報を表示',
      ko: '시스템 도움말 정보 표시',
      es: 'Mostrar información de ayuda del sistema',
      fr: 'Afficher les informations d\'aide du système',
      de: 'System-Hilfeinformationen anzeigen',
    },
    category: 'utility',
    templates: {
      zh: ['帮助', '使用说明', '功能介绍', '怎么使用', '指令说明', '命令列表'],
      en: ['help', 'usage', 'how to use', 'instructions', 'commands', 'command list'],
      ja: ['ヘルプ', '使用方法', '機能紹介', '使い方', 'コマンド一覧'],
      ko: ['도움말', '사용법', '기능 소개', '사용 방법', '명령어 목록'],
      es: ['ayuda', 'uso', 'cómo usar', 'instrucciones', 'comandos'],
      fr: ['aide', 'utilisation', 'comment utiliser', 'instructions', 'commandes'],
      de: ['Hilfe', 'Verwendung', 'wie zu verwenden', 'Anweisungen', 'Befehle'],
    },
    priority: 1,
  },
  {
    id: 'get_system_info',
    action: 'getSystemInfo',
    description: {
      zh: '显示系统状态和统计信息',
      en: 'Display system status and statistics',
      ja: 'システム状態と統計情報を表示',
      ko: '시스템 상태 및 통계 정보 표시',
      es: 'Mostrar estado del sistema y estadísticas',
      fr: 'Afficher l\'état du système et les statistiques',
      de: 'Systemstatus und Statistiken anzeigen',
    },
    category: 'utility',
    templates: {
      zh: ['系统信息', '系统状态', '统计信息', '系统概况', '状态总览'],
      en: ['system info', 'system status', 'statistics', 'system overview', 'status summary'],
      ja: ['システム情報', 'システム状態', '統計情報', 'システム概要'],
      ko: ['시스템 정보', '시스템 상태', '통계 정보', '시스템 개요'],
      es: ['información del sistema', 'estado del sistema', 'estadísticas', 'resumen del sistema'],
      fr: ['informations système', 'état du système', 'statistiques', 'aperçu du système'],
      de: ['Systeminformationen', 'Systemstatus', 'Statistiken', 'Systemübersicht'],
    },
    priority: 2,
  },
  {
    id: 'exit_program',
    action: 'exitProgram',
    description: {
      zh: '退出CLI程序',
      en: 'Exit CLI program',
      ja: 'CLIプログラムを終了',
      ko: 'CLI 프로그램 종료',
      es: 'Salir del programa CLI',
      fr: 'Quitter le programme CLI',
      de: 'CLI-Programm beenden',
    },
    category: 'utility',
    templates: {
      zh: ['退出', '再见', '结束', '关闭', '离开', 'bye'],
      en: ['exit', 'quit', 'goodbye', 'bye', 'close', 'end'],
      ja: ['終了', 'さようなら', 'バイバイ', '閉じる'],
      ko: ['종료', '안녕', '바이바이', '닫기'],
      es: ['salir', 'adiós', 'cerrar', 'terminar'],
      fr: ['sortir', 'au revoir', 'fermer', 'terminer'],
      de: ['beenden', 'auf Wiedersehen', 'schließen', 'ende'],
    },
    priority: 1,
  },
];

/**
 * Language detection patterns for identifying user input language.
 */
const languagePatterns: Record<SupportedLanguage, readonly RegExp[]> = {
  zh: [
    /[\u4e00-\u9fff]/,  // Chinese characters
    /[，。！？；：""'']/,  // Chinese punctuation
    /\b(查询|我的|设备|用户|积分|状态|在线|添加|删除|帮助|退出)\b/i,
  ],
  en: [
    /\b(check|my|device|user|points|status|online|add|remove|help|exit|query|show|list)\b/i,
    /\b(what|how|where|when|why|which|who)\b/i,
    /\b(is|are|am|was|were|have|has|had|do|does|did|will|would|can|could|should|may|might)\b/i,
  ],
  ja: [
    /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/,  // Hiragana, Katakana, Kanji
    /\b(確認|私|デバイス|ユーザー|ポイント|状態|オンライン|追加|削除|ヘルプ|終了)\b/i,
  ],
  ko: [
    /[\uac00-\ud7af]/,  // Korean characters
    /\b(확인|내|장치|사용자|포인트|상태|온라인|추가|제거|도움말|종료)\b/i,
  ],
  es: [
    /\b(verificar|mi|dispositivo|usuario|puntos|estado|en línea|agregar|eliminar|ayuda|salir)\b/i,
    /\b(qué|cómo|dónde|cuándo|por qué|cuál|quién)\b/i,
  ],
  fr: [
    /\b(vérifier|mon|ma|mes|appareil|utilisateur|points|état|en ligne|ajouter|supprimer|aide|sortir)\b/i,
    /\b(que|comment|où|quand|pourquoi|quel|qui)\b/i,
  ],
  de: [
    /\b(prüfen|mein|meine|Gerät|Benutzer|Punkte|Status|online|hinzufügen|entfernen|Hilfe|beenden)\b/i,
    /\b(was|wie|wo|wann|warum|welche|wer)\b/i,
  ],
};

/**
 * Multi-language support class for managing intent templates and language detection.
 */
export class MultiLanguageManager {
  private readonly templates: Map<string, MultiLangIntentTemplate>;
  private readonly languageCache: Map<string, LanguageDetectionResult>;

  constructor() {
    this.templates = new Map();
    this.languageCache = new Map();
    
    // Initialize templates map
    for (const template of multiLangIntentTemplates) {
      this.templates.set(template.id, template);
    }

    console.log(`MultiLanguageManager initialized with ${this.templates.size} templates`);
  }

  /**
   * Detects the language of the input text.
   * @param text - Input text to analyze
   * @returns Language detection result
   */
  public detectLanguage(text: string): LanguageDetectionResult {
    // Check cache first
    const cached = this.languageCache.get(text);
    if (cached) {
      return cached;
    }

    const scores: Record<SupportedLanguage, number> = {
      zh: 0, en: 0, ja: 0, ko: 0, es: 0, fr: 0, de: 0,
    };
    const detectedPatterns: string[] = [];

    // Score each language based on pattern matches
    for (const [lang, patterns] of Object.entries(languagePatterns)) {
      const language = lang as SupportedLanguage;
      
      for (const pattern of patterns) {
        const matches = text.match(pattern);
        if (matches) {
          scores[language] += matches.length;
          detectedPatterns.push(`${language}:${pattern.source}`);
        }
      }
    }

    // Find the language with the highest score
    let bestLanguage: SupportedLanguage = 'en'; // Default to English
    let bestScore = 0;

    for (const [lang, score] of Object.entries(scores)) {
      if (score > bestScore) {
        bestScore = score;
        bestLanguage = lang as SupportedLanguage;
      }
    }

    // Calculate confidence (0-1 scale)
    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
    const confidence = totalScore > 0 ? bestScore / totalScore : 0.5;

    const result: LanguageDetectionResult = {
      language: bestLanguage,
      confidence,
      detectedPatterns,
    };

    // Cache the result
    this.languageCache.set(text, result);

    return result;
  }

  /**
   * Gets all intent templates for a specific language.
   * @param language - Target language
   * @returns Array of flattened intent templates
   */
  public getIntentTemplatesForLanguage(language: SupportedLanguage): Array<{
    id: string;
    text: string;
    action: Actions.ActionName;
    description: string;
    category: string;
    parameters?: readonly string[];
    priority: number;
  }> {
    const results: Array<{
      id: string;
      text: string;
      action: Actions.ActionName;
      description: string;
      category: string;
      parameters?: readonly string[];
      priority: number;
    }> = [];

    for (const template of this.templates.values()) {
      const templates = template.templates[language];
      const description = template.description[language] || template.description.en;
      
      if (templates && templates.length > 0) {
        for (const text of templates) {
          const result: {
            id: string;
            text: string;
            action: Actions.ActionName;
            description: string;
            category: string;
            parameters?: readonly string[];
            priority: number;
          } = {
            id: `${template.id}_${language}_${results.length}`,
            text,
            action: template.action,
            description,
            category: template.category,
            priority: template.priority || 1,
          };

          if (template.parameters) {
            result.parameters = template.parameters;
          }

          results.push(result);
        }
      }
    }

    // Sort by priority (higher priority first)
    return results.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Gets all intent templates across all languages.
   * @returns Array of flattened intent templates
   */
  public getAllIntentTemplates(): Array<{
    id: string;
    text: string;
    action: Actions.ActionName;
    description: string;
    category: string;
    language: SupportedLanguage;
    parameters?: readonly string[];
    priority: number;
  }> {
    const results: Array<{
      id: string;
      text: string;
      action: Actions.ActionName;
      description: string;
      category: string;
      language: SupportedLanguage;
      parameters?: readonly string[];
      priority: number;
    }> = [];

    for (const template of this.templates.values()) {
      for (const [lang, templates] of Object.entries(template.templates)) {
        const language = lang as SupportedLanguage;
        const description = template.description[language] || template.description.en;
        
        for (const text of templates) {
          const result: {
            id: string;
            text: string;
            action: Actions.ActionName;
            description: string;
            category: string;
            language: SupportedLanguage;
            parameters?: readonly string[];
            priority: number;
          } = {
            id: `${template.id}_${language}_${results.length}`,
            text,
            action: template.action,
            description,
            category: template.category,
            language,
            priority: template.priority || 1,
          };

          if (template.parameters) {
            result.parameters = template.parameters;
          }

          results.push(result);
        }
      }
    }

    return results.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Adds a new multi-language intent template.
   * @param template - New template to add
   */
  public addTemplate(template: MultiLangIntentTemplate): void {
    this.templates.set(template.id, template);
    console.log(`Added new multi-language template: ${template.id}`);
  }

  /**
   * Removes an intent template by ID.
   * @param id - Template ID to remove
   * @returns True if template was removed, false if not found
   */
  public removeTemplate(id: string): boolean {
    const removed = this.templates.delete(id);
    if (removed) {
      console.log(`Removed multi-language template: ${id}`);
    }
    return removed;
  }

  /**
   * Gets a template by ID.
   * @param id - Template ID
   * @returns Template or undefined if not found
   */
  public getTemplate(id: string): MultiLangIntentTemplate | undefined {
    return this.templates.get(id);
  }

  /**
   * Gets all supported languages.
   * @returns Array of supported language codes
   */
  public getSupportedLanguages(): readonly SupportedLanguage[] {
    return ['zh', 'en', 'ja', 'ko', 'es', 'fr', 'de'];
  }

  /**
   * Gets statistics about the multi-language manager.
   * @returns Statistics object
   */
  public getStats(): {
    readonly totalTemplates: number;
    readonly totalIntents: number;
    readonly languageDistribution: Record<SupportedLanguage, number>;
    readonly cacheSize: number;
  } {
    const languageDistribution: Record<SupportedLanguage, number> = {
      zh: 0, en: 0, ja: 0, ko: 0, es: 0, fr: 0, de: 0,
    };

    let totalIntents = 0;
    
    for (const template of this.templates.values()) {
      for (const [lang, templates] of Object.entries(template.templates)) {
        const language = lang as SupportedLanguage;
        languageDistribution[language] += templates.length;
        totalIntents += templates.length;
      }
    }

    return {
      totalTemplates: this.templates.size,
      totalIntents,
      languageDistribution,
      cacheSize: this.languageCache.size,
    };
  }

  /**
   * Clears the language detection cache.
   */
  public clearCache(): void {
    this.languageCache.clear();
    console.log('Language detection cache cleared');
  }
}

/**
 * Default multi-language manager instance.
 */
export const defaultMultiLangManager = new MultiLanguageManager();
