/**
 * @fileoverview Business logic actions for UserSphere CLI.
 * Contains all user and device management functionality with mock data.
 */

/**
 * Represents a user in the UserSphere system.
 */
export interface User {
  readonly username: string;
  readonly points: number;
  readonly avatar: string;
  readonly motto: string;
  readonly email?: string;
  readonly joinDate?: Date;
  readonly lastActive?: Date;
}

/**
 * Represents a device in the UserSphere system.
 */
export interface Device {
  readonly name: string;
  readonly online: boolean;
  readonly deviceType?: string;
  readonly lastSeen?: Date;
  readonly ipAddress?: string | undefined;
}

/**
 * Result of an action execution.
 */
export interface ActionResult {
  readonly success: boolean;
  readonly message: string;
  readonly data?: unknown;
}

/**
 * Mock user data for demonstration purposes.
 */
export const mockUser: User = {
  username: 'test_user_01',
  points: 1280,
  avatar: 'https://example.com/avatar.png',
  motto: 'Keep it simple.',
  email: 'test_user_01@example.com',
  joinDate: new Date('2023-01-15'),
  lastActive: new Date(),
};

/**
 * Mock device data for demonstration purposes.
 * Using let to allow modifications for add/remove operations.
 */
export let mockDevices: Device[] = [
  {
    name: 'MacBook-Pro',
    online: true,
    deviceType: 'laptop',
    lastSeen: new Date(),
    ipAddress: '192.168.1.100',
  },
  {
    name: 'iPhone-15',
    online: true,
    deviceType: 'mobile',
    lastSeen: new Date(),
    ipAddress: '192.168.1.101',
  },
  {
    name: 'iPad-Air',
    online: false,
    deviceType: 'tablet',
    lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    ipAddress: '192.168.1.102',
  },
  {
    name: 'iMac-2021',
    online: true,
    deviceType: 'desktop',
    lastSeen: new Date(),
    ipAddress: '192.168.1.103',
  },
];

// ================== USER INFORMATION ACTIONS ==================

/**
 * Retrieves the user's current points.
 * @returns Formatted string with user points information
 */
export function getUserPoints(): string {
  return `您的积分是 ${mockUser.points} 分`;
}

/**
 * Retrieves the user's username.
 * @returns Formatted string with username information
 */
export function getUsername(): string {
  return `您的用户名是 ${mockUser.username}`;
}

/**
 * Retrieves the user's avatar URL.
 * @returns Formatted string with avatar URL
 */
export function getUserAvatar(): string {
  return `头像 URL: ${mockUser.avatar}`;
}

/**
 * Retrieves the user's motto/signature.
 * @returns Formatted string with user motto
 */
export function getUserMotto(): string {
  return `座右铭: ${mockUser.motto}`;
}

/**
 * Retrieves comprehensive user profile information.
 * @returns Formatted string with complete user profile
 */
export function getUserProfile(): string {
  const profile = [
    `用户档案:`,
    `  用户名: ${mockUser.username}`,
    `  积分: ${mockUser.points} 分`,
    `  座右铭: ${mockUser.motto}`,
  ];

  if (mockUser.email) {
    profile.push(`  邮箱: ${mockUser.email}`);
  }

  if (mockUser.joinDate) {
    profile.push(`  加入时间: ${mockUser.joinDate.toLocaleDateString('zh-CN')}`);
  }

  if (mockUser.lastActive) {
    profile.push(`  最后活跃: ${mockUser.lastActive.toLocaleString('zh-CN')}`);
  }

  return profile.join('\n');
}

// ================== DEVICE MANAGEMENT ACTIONS ==================

/**
 * Lists all registered devices.
 * @returns Formatted string with device list
 */
export function listDevices(): string {
  if (mockDevices.length === 0) {
    return '您还没有绑定任何设备。';
  }

  const deviceList = mockDevices.map(device => {
    const status = device.online ? '在线' : '离线';
    const type = device.deviceType ? ` (${device.deviceType})` : '';
    return `  • ${device.name}${type} - ${status}`;
  });

  return `当前绑定的设备 (${mockDevices.length} 个):\n${deviceList.join('\n')}`;
}

/**
 * Lists only online devices.
 * @returns Formatted string with online device list
 */
export function listOnlineDevices(): string {
  const onlineDevices = mockDevices.filter(device => device.online);
  
  if (onlineDevices.length === 0) {
    return '当前没有在线设备。';
  }

  const deviceList = onlineDevices.map(device => {
    const type = device.deviceType ? ` (${device.deviceType})` : '';
    return `  • ${device.name}${type}`;
  });

  return `在线设备 (${onlineDevices.length} 个):\n${deviceList.join('\n')}`;
}

/**
 * Checks the status of specific devices based on user input.
 * Supports fuzzy matching and multiple device queries.
 * @param userInput - User input containing device names or patterns
 * @returns Formatted string with device status information
 */
export function checkDeviceStatus(userInput: string): string {
  if (!userInput.trim()) {
    return '请指定要查询的设备名称。';
  }

  // Extract potential device names from user input
  const inputLower = userInput.toLowerCase();
  const foundDevices = mockDevices.filter(device => {
    const deviceNameLower = device.name.toLowerCase();
    return deviceNameLower.includes(inputLower) || 
           inputLower.includes(deviceNameLower) ||
           new RegExp(deviceNameLower.replace(/[-\s]/g, '.*'), 'i').test(inputLower);
  });

  if (foundDevices.length === 0) {
    // Try partial matching with individual words
    const words = inputLower.split(/\s+/).filter(word => word.length > 2);
    const partialMatches = mockDevices.filter(device => 
      words.some(word => device.name.toLowerCase().includes(word))
    );

    if (partialMatches.length > 0) {
      const statusList = partialMatches.map(device => {
        const status = device.online ? '在线' : '离线';
        const lastSeen = device.lastSeen ? 
          ` (最后在线: ${device.lastSeen.toLocaleString('zh-CN')})` : '';
        return `  • ${device.name} - ${status}${device.online ? '' : lastSeen}`;
      });
      return `找到相似设备:\n${statusList.join('\n')}`;
    }

    return `未找到匹配的设备。可用设备: ${mockDevices.map(d => d.name).join(', ')}`;
  }

  const statusList = foundDevices.map(device => {
    const status = device.online ? '在线' : '离线';
    const type = device.deviceType ? ` (${device.deviceType})` : '';
    const lastSeen = !device.online && device.lastSeen ? 
      ` - 最后在线: ${device.lastSeen.toLocaleString('zh-CN')}` : '';
    const ip = device.online && device.ipAddress ? ` - IP: ${device.ipAddress}` : '';
    
    return `  • ${device.name}${type} - ${status}${lastSeen}${ip}`;
  });

  return `设备状态:\n${statusList.join('\n')}`;
}

/**
 * Adds a new device to the system.
 * @param deviceName - Name of the device to add
 * @param online - Whether the device is initially online (default: true)
 * @param deviceType - Type of the device (optional)
 * @returns Result message indicating success or failure
 */
export function addDevice(deviceName: string, online: boolean = true, deviceType?: string): string {
  if (!deviceName.trim()) {
    return '请提供有效的设备名称。';
  }

  const trimmedName = deviceName.trim();
  
  // Check if device already exists (case-insensitive)
  if (mockDevices.some(device => device.name.toLowerCase() === trimmedName.toLowerCase())) {
    return `设备 "${trimmedName}" 已存在。`;
  }

  // Validate device name format
  if (!/^[a-zA-Z0-9\u4e00-\u9fa5\-_\s]+$/.test(trimmedName)) {
    return '设备名称只能包含字母、数字、中文、连字符和下划线。';
  }

  const newDevice: Device = {
    name: trimmedName,
    online,
    deviceType: deviceType || 'unknown',
    lastSeen: new Date(),
  };

  // Add ipAddress conditionally to avoid undefined assignment
  if (online) {
    (newDevice as any).ipAddress = `192.168.1.${100 + mockDevices.length + 1}`;
  }

  mockDevices.push(newDevice);
  
  const statusText = online ? '在线' : '离线';
  return `设备 "${trimmedName}" 已成功添加 (状态: ${statusText})。`;
}

/**
 * Removes a device from the system.
 * @param deviceName - Name of the device to remove
 * @returns Result message indicating success or failure
 */
export function removeDevice(deviceName: string): string {
  if (!deviceName.trim()) {
    return '请提供要删除的设备名称。';
  }

  const trimmedName = deviceName.trim();
  const deviceIndex = mockDevices.findIndex(device => 
    device.name.toLowerCase() === trimmedName.toLowerCase()
  );

  if (deviceIndex === -1) {
    // Try fuzzy matching for user convenience
    const fuzzyMatch = mockDevices.find(device => 
      device.name.toLowerCase().includes(trimmedName.toLowerCase()) ||
      trimmedName.toLowerCase().includes(device.name.toLowerCase())
    );

    if (fuzzyMatch) {
      return `未找到完全匹配的设备 "${trimmedName}"。您是否想删除 "${fuzzyMatch.name}"？请使用完整设备名称。`;
    }

    return `设备 "${trimmedName}" 不存在。可用设备: ${mockDevices.map(d => d.name).join(', ')}`;
  }

  const removedDevice = mockDevices.splice(deviceIndex, 1)[0]!;
  return `设备 "${removedDevice.name}" 已成功解绑。`;
}

/**
 * Updates the online status of a device.
 * @param deviceName - Name of the device to update
 * @param online - New online status
 * @returns Result message indicating success or failure
 */
export function updateDeviceStatus(deviceName: string, online: boolean): string {
  if (!deviceName.trim()) {
    return '请提供设备名称。';
  }

  const trimmedName = deviceName.trim();
  const device = mockDevices.find(d => 
    d.name.toLowerCase() === trimmedName.toLowerCase()
  );

  if (!device) {
    return `设备 "${trimmedName}" 不存在。`;
  }

  // Update the device (create new object since Device interface is readonly)
  const deviceIndex = mockDevices.findIndex(d => d.name === device.name);
  const updatedDevice: any = {
    ...device,
    online,
    lastSeen: new Date(),
  };

  // Handle ipAddress conditionally
  if (online) {
    updatedDevice.ipAddress = device.ipAddress || `192.168.1.${100 + deviceIndex + 1}`;
  } else {
    updatedDevice.ipAddress = device.ipAddress;
  }

  mockDevices[deviceIndex] = updatedDevice;

  const statusText = online ? '在线' : '离线';
  return `设备 "${device.name}" 状态已更新为 ${statusText}。`;
}

// ================== UTILITY ACTIONS ==================

/**
 * Provides help information about available commands.
 * @returns Formatted help text
 */
export function getHelp(): string {
  return `UserSphere CLI 可用功能:

用户信息:
  • 查询积分 - 显示当前积分余额
  • 查询用户名 - 显示用户名信息
  • 查询头像 - 显示头像链接
  • 查询座右铭 - 显示个人座右铭
  • 查询资料 - 显示完整用户档案

设备管理:
  • 列出设备 - 显示所有绑定设备
  • 在线设备 - 显示当前在线设备
  • 设备状态 [设备名] - 查询特定设备状态
  • 添加设备 [设备名] - 绑定新设备
  • 删除设备 [设备名] - 解绑设备

系统:
  • 帮助 - 显示此帮助信息
  • 退出 - 退出程序

提示: 您可以使用自然语言描述您的需求，系统会智能匹配相应功能。`;
}

/**
 * Gets system statistics and information.
 * @returns Formatted system information
 */
export function getSystemInfo(): string {
  const totalDevices = mockDevices.length;
  const onlineDevices = mockDevices.filter(d => d.online).length;
  const offlineDevices = totalDevices - onlineDevices;

  return `系统信息:
  • 用户: ${mockUser.username} (积分: ${mockUser.points})
  • 设备总数: ${totalDevices}
  • 在线设备: ${onlineDevices}
  • 离线设备: ${offlineDevices}
  • 系统状态: 正常运行`;
}

/**
 * Handles program exit.
 * @returns Exit message
 */
export function exitProgram(): string {
  return '感谢使用 UserSphere CLI，再见！';
}

// ================== ACTION REGISTRY ==================

/**
 * Registry of all available actions for easy lookup.
 */
export const actionRegistry = {
  // User actions
  getUserPoints,
  getUsername,
  getUserAvatar,
  getUserMotto,
  getUserProfile,
  
  // Device actions
  listDevices,
  listOnlineDevices,
  checkDeviceStatus,
  addDevice,
  removeDevice,
  updateDeviceStatus,
  
  // Utility actions
  getHelp,
  getSystemInfo,
  exitProgram,
} as const;

/**
 * Type representing all available action names.
 */
export type ActionName = keyof typeof actionRegistry;

/**
 * Executes an action by name with parameters.
 * @param actionName - Name of the action to execute
 * @param params - Parameters to pass to the action
 * @returns Result of the action execution
 */
export function executeAction(actionName: ActionName, ...params: unknown[]): ActionResult {
  try {
    const action = actionRegistry[actionName];
    if (!action) {
      return {
        success: false,
        message: `未知操作: ${actionName}`,
      };
    }

    const result = (action as any)(...params);
    return {
      success: true,
      message: result,
      data: { actionName, params },
    };
  } catch (error) {
    return {
      success: false,
      message: `执行操作 ${actionName} 时发生错误: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
