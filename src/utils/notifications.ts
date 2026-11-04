import { Notification } from "electron";
import { dataStore } from "./storage";

export interface AlertConfig {
  highThreshold: number;
  lowThreshold: number;
  criticalHighThreshold: number;
  criticalLowThreshold: number;
  rapidRiseThreshold: number;
  rapidFallThreshold: number;
  enableHighAlerts: boolean;
  enableLowAlerts: boolean;
  enableTrendAlerts: boolean;
  enableSoundAlerts: boolean;
  snoozeTime: number;
}

interface GlucoseReading {
  value: number;
  trend?: string;
  timestamp?: Date;
}

interface AlertState {
  lastAlertTime: number;
  lastAlertType: string | null;
  snoozedUntil: number;
  lastValue: number | null;
  lastTimestamp: number | null;
}

class AlertManager {
  private state: AlertState = {
    lastAlertTime: 0,
    lastAlertType: null,
    snoozedUntil: 0,
    lastValue: null,
    lastTimestamp: null,
  };

  private defaultConfig: AlertConfig = {
    highThreshold: 180,
    lowThreshold: 70,
    criticalHighThreshold: 250,
    criticalLowThreshold: 55,
    rapidRiseThreshold: 3,
    rapidFallThreshold: 3,
    enableHighAlerts: true,
    enableLowAlerts: true,
    enableTrendAlerts: true,
    enableSoundAlerts: true,
    snoozeTime: 30,
  };

  async getConfig(): Promise<AlertConfig> {
    const savedConfig = await dataStore.getValue("alertConfig");
    if (savedConfig) {
      return { ...this.defaultConfig, ...JSON.parse(savedConfig) };
    }
    return this.defaultConfig;
  }

  async saveConfig(config: Partial<AlertConfig>): Promise<void> {
    const currentConfig = await this.getConfig();
    const newConfig = { ...currentConfig, ...config };
    await dataStore.setValue("alertConfig", JSON.stringify(newConfig));
  }

  snooze(minutes?: number): void {
    const config = this.defaultConfig;
    const snoozeMinutes = minutes || config.snoozeTime;
    this.state.snoozedUntil = Date.now() + snoozeMinutes * 60 * 1000;
    console.log(`🔕 Alerts snoozed for ${snoozeMinutes} minutes`);
  }

  private isSnoozed(): boolean {
    return Date.now() < this.state.snoozedUntil;
  }

  private shouldAlert(alertType: string, minInterval: number = 300000): boolean {
    if (this.isSnoozed()) {
      console.log("🔕 Alerts are snoozed");
      return false;
    }

    if (this.state.lastAlertType === alertType) {
      const timeSinceLastAlert = Date.now() - this.state.lastAlertTime;
      if (timeSinceLastAlert < minInterval) {
        return false;
      }
    }

    return true;
  }

  private calculateRate(reading: GlucoseReading): number | null {
    if (!this.state.lastValue || !this.state.lastTimestamp || !reading.timestamp) {
      return null;
    }

    const timeDiff = reading.timestamp.getTime() - this.state.lastTimestamp;
    const valueDiff = reading.value - this.state.lastValue;
    const ratePerMinute = (valueDiff / timeDiff) * 60000;
    return ratePerMinute;
  }

  private sendNotification(
    title: string,
    body: string,
    urgency: "low" | "normal" | "critical" = "normal",
    sound: boolean = true,
    alertType: string = "normal",
    value?: number,
    trend?: string,
    rate?: number
  ): void {
    const showAlert = (global as any).showAlertWindow;
    
    if (showAlert) {
      showAlert({
        type: alertType,
        title,
        body,
        value,
        trend,
        rate,
      });
    } else {
      const notification = new Notification({
        title,
        body,
        urgency,
        silent: !sound,
      });
      notification.show();
    }

    console.log(`🔔 Alert: ${title} - ${body}`);
  }

  async checkAlerts(reading: GlucoseReading): Promise<void> {
    const config = await this.getConfig();
    const rate = this.calculateRate(reading);

    this.state.lastValue = reading.value;
    this.state.lastTimestamp = reading.timestamp?.getTime() || Date.now();

    if (config.enableHighAlerts && reading.value >= config.criticalHighThreshold) {
      if (this.shouldAlert("critical-high", 600000)) {
        this.sendNotification(
          "⚠️ GLUCOSA CRÍTICA ALTA",
          `Tu glucosa está en ${reading.value} mg/dL. Toma acción inmediatamente.`,
          "critical",
          config.enableSoundAlerts,
          "critical-high",
          reading.value,
          reading.trend
        );
        this.state.lastAlertTime = Date.now();
        this.state.lastAlertType = "critical-high";
      }
      return;
    }

    if (config.enableLowAlerts && reading.value <= config.criticalLowThreshold) {
      if (this.shouldAlert("critical-low", 600000)) {
        this.sendNotification(
          "⚠️ GLUCOSA CRÍTICA BAJA",
          `Tu glucosa está en ${reading.value} mg/dL. Come algo ahora.`,
          "critical",
          config.enableSoundAlerts,
          "critical-low",
          reading.value,
          reading.trend
        );
        this.state.lastAlertTime = Date.now();
        this.state.lastAlertType = "critical-low";
      }
      return;
    }

    if (config.enableHighAlerts && reading.value > config.highThreshold) {
      if (this.shouldAlert("high", 1800000)) {
        this.sendNotification(
          "Glucosa Alta",
          `Tu glucosa está en ${reading.value} mg/dL`,
          "normal",
          config.enableSoundAlerts,
          "high",
          reading.value,
          reading.trend
        );
        this.state.lastAlertTime = Date.now();
        this.state.lastAlertType = "high";
      }
    }

    if (config.enableLowAlerts && reading.value < config.lowThreshold) {
      if (this.shouldAlert("low", 1800000)) {
        this.sendNotification(
          "Glucosa Baja",
          `Tu glucosa está en ${reading.value} mg/dL`,
          "normal",
          config.enableSoundAlerts,
          "low",
          reading.value,
          reading.trend
        );
        this.state.lastAlertTime = Date.now();
        this.state.lastAlertType = "low";
      }
    }

    if (config.enableTrendAlerts && rate && rate > config.rapidRiseThreshold) {
      if (this.shouldAlert("rapid-rise", 1800000)) {
        this.sendNotification(
          "Subida Rápida",
          `Tu glucosa está subiendo rápido: ${reading.value} mg/dL (${rate.toFixed(1)} mg/dL/min)`,
          "normal",
          config.enableSoundAlerts,
          "rapid-rise",
          reading.value,
          reading.trend,
          rate
        );
        this.state.lastAlertTime = Date.now();
        this.state.lastAlertType = "rapid-rise";
      }
    }

    if (config.enableTrendAlerts && rate && rate < -config.rapidFallThreshold) {
      if (this.shouldAlert("rapid-fall", 1800000)) {
        this.sendNotification(
          "Bajada Rápida",
          `Tu glucosa está bajando rápido: ${reading.value} mg/dL (${rate.toFixed(1)} mg/dL/min)`,
          "normal",
          config.enableSoundAlerts,
          "rapid-fall",
          reading.value,
          reading.trend,
          rate
        );
        this.state.lastAlertTime = Date.now();
        this.state.lastAlertType = "rapid-fall";
      }
    }
  }

  getStatus(): { isSnoozed: boolean; snoozedUntil: number; lastAlert: string | null } {
    return {
      isSnoozed: this.isSnoozed(),
      snoozedUntil: this.state.snoozedUntil,
      lastAlert: this.state.lastAlertType,
    };
  }
}

export const alertManager = new AlertManager();

export const validateNotification = async (data: GlucoseReading): Promise<void> => {
  await alertManager.checkAlerts(data);
};
