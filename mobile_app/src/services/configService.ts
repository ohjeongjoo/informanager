import AsyncStorage from '@react-native-async-storage/async-storage';

export interface KioskLocation {
  latitude: number;
  longitude: number;
  name: string;
  address: string;
}

export interface AppConfig {
  kioskLocation: KioskLocation;
  proximityDistance: number; // 미터 단위
  notificationSound: boolean;
  notificationVibration: boolean;
  autoLocationTracking: boolean;
  darkMode: boolean;
}

const DEFAULT_CONFIG: AppConfig = {
  kioskLocation: {
    latitude: 37.5665, // 서울시청 기본값 (실제 사용 시 변경 필요)
    longitude: 126.9780,
    name: '기본 키오스크',
    address: '서울특별시 중구 세종대로 110'
  },
  proximityDistance: 0, // 0m (설정 가능)
  notificationSound: true,
  notificationVibration: true,
  autoLocationTracking: false,
  darkMode: false
};

class ConfigService {
  private config: AppConfig = DEFAULT_CONFIG;
  private readonly CONFIG_STORAGE_KEY = 'app_config';

  constructor() {
    this.loadConfig();
  }

  async loadConfig(): Promise<void> {
    try {
      const storedConfig = await AsyncStorage.getItem(this.CONFIG_STORAGE_KEY);
      if (storedConfig) {
        this.config = { ...DEFAULT_CONFIG, ...JSON.parse(storedConfig) };
      }
    } catch (error) {
      console.error('Failed to load config:', error);
      this.config = DEFAULT_CONFIG;
    }
  }

  async saveConfig(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.CONFIG_STORAGE_KEY, JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  }

  getConfig(): AppConfig {
    return { ...this.config };
  }

  async updateConfig(updates: Partial<AppConfig>): Promise<void> {
    this.config = { ...this.config, ...updates };
    await this.saveConfig();
  }

  getKioskLocation(): KioskLocation {
    return { ...this.config.kioskLocation };
  }

  async setKioskLocation(location: KioskLocation): Promise<void> {
    await this.updateConfig({ kioskLocation: location });
  }

  getProximityDistance(): number {
    return this.config.proximityDistance;
  }

  async setProximityDistance(distance: number): Promise<void> {
    await this.updateConfig({ proximityDistance: distance });
  }

  async resetToDefaults(): Promise<void> {
    this.config = { ...DEFAULT_CONFIG };
    await this.saveConfig();
  }

  // 키오스크 위치 설정을 위한 헬퍼 메서드
  async setKioskLocationFromCoordinates(
    latitude: number, 
    longitude: number, 
    name?: string, 
    address?: string
  ): Promise<void> {
    const location: KioskLocation = {
      latitude,
      longitude,
      name: name || '키오스크',
      address: address || '주소 미설정'
    };
    await this.setKioskLocation(location);
  }

  // 현재 설정을 JSON으로 내보내기
  exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  // JSON에서 설정 가져오기
  async importConfig(configJson: string): Promise<void> {
    try {
      const importedConfig = JSON.parse(configJson);
      // 유효성 검사
      if (this.validateConfig(importedConfig)) {
        await this.updateConfig(importedConfig);
      } else {
        throw new Error('Invalid configuration format');
      }
    } catch (error) {
      console.error('Failed to import config:', error);
      throw error;
    }
  }

  private validateConfig(config: any): boolean {
    // 기본적인 유효성 검사
    return (
      config &&
      typeof config === 'object' &&
      config.kioskLocation &&
      typeof config.kioskLocation.latitude === 'number' &&
      typeof config.kioskLocation.longitude === 'number' &&
      typeof config.proximityDistance === 'number' &&
      config.proximityDistance >= 0
    );
  }
}

export const configService = new ConfigService();