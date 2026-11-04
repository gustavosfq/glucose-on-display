import { LibreLinkClient } from "libre-link-unofficial-api";
import { detectRegion, type Region } from "../config/regions";

export interface GlucoseData {
  value: string;
  color: string;
  data?: {
    value: number;
    trend?: string;
    timestamp?: Date;
  };
}

export class GlucoseClient {
  private client: LibreLinkClient | null = null;
  private isLoggedIn: boolean = false;
  private lastLoginAttempt: number = 0;
  private readonly LOGIN_COOLDOWN = 300000; // 5 minutos entre intentos de login
  private username: string;
  private password: string;
  private loginAttempts: number = 0;
  private readonly MAX_ATTEMPTS = 3;

  constructor(username: string, password: string) {
    this.username = username;
    this.password = password;
  }

  async read(): Promise<GlucoseData> {
    try {
      // Evitar demasiados intentos de login
      const now = Date.now();
      if (!this.isLoggedIn && now - this.lastLoginAttempt < this.LOGIN_COOLDOWN) {
        const waitTime = Math.ceil((this.LOGIN_COOLDOWN - (now - this.lastLoginAttempt)) / 1000);
        console.log(`Cooldown active: ${waitTime} seconds remaining`);
        return {
          value: `⏳ ${Math.ceil(waitTime / 60)}m`,
          color: "orange",
        };
      }

      // Si se alcanzó el máximo de intentos, esperar más tiempo
      if (this.loginAttempts >= this.MAX_ATTEMPTS && now - this.lastLoginAttempt < this.LOGIN_COOLDOWN * 2) {
        const waitTime = Math.ceil((this.LOGIN_COOLDOWN * 2 - (now - this.lastLoginAttempt)) / 1000);
        console.log(`Too many failed attempts. Wait ${waitTime} seconds`);
        return {
          value: `🚫 ${Math.ceil(waitTime / 60)}m`,
          color: "red",
        };
      }

      // Resetear intentos después de mucho tiempo
      if (now - this.lastLoginAttempt > this.LOGIN_COOLDOWN * 2) {
        this.loginAttempts = 0;
      }

      // Crear cliente solo si no existe
      if (!this.client) {
        console.log(`Creating LibreLinkClient for ${this.username}`);
        
        this.client = new LibreLinkClient({
          email: this.username,
          password: this.password,
          lluVersion: "4.16.0",
          cache: true,
        });
      }

      // Login solo si es necesario
      if (!this.isLoggedIn) {
        this.lastLoginAttempt = now;
        this.loginAttempts++;
        console.log(`Login attempt ${this.loginAttempts}/${this.MAX_ATTEMPTS}...`);
        await this.client.login();
        this.isLoggedIn = true;
        this.loginAttempts = 0; // Resetear intentos después de login exitoso
        console.log("✓ Login successful");
      }
      
      const reading = await this.client.read();
      
      console.log("✓ Glucose data fetched:", reading.value, reading.trendType);

      return {
        value: `${reading.value} ${trendToText(reading.trendType)}`,
        color: getColor(reading.value),
        data: {
          value: reading.value,
          trend: reading.trendType,
          timestamp: new Date(reading.timestamp),
        },
      };
    } catch (error: any) {
      const errorMsg = error.message || String(error);
      console.error("✗ Error fetching glucose data:", errorMsg);
      
      // Detectar tipo de error
      const isAuthError = errorMsg.includes("430") || errorMsg.includes("401") || 
                         errorMsg.includes("403") || errorMsg.includes("DOCTYPE") ||
                         errorMsg.includes("429");
      
      if (isAuthError) {
        console.log("Authentication error detected, resetting client...");
        this.isLoggedIn = false;
        this.client = null;
      } else {
        // Para otros errores, solo resetear el estado de login
        this.isLoggedIn = false;
      }
      
      return {
        value: "???",
        color: "red",
      };
    }
  }
}

const getColor = (glucose: number): string => {
  return glucose > 180 ? "red" : glucose < 70 ? "red" : "green";
};

const trendToText = (trend: string) => {
  switch (trend) {
    case "SingleDown":
      return "↓";
    case "FortyFiveDown":
      return "↘";
    case "Flat":
      return "️→";
    case "FortyFiveUp":
      return "↗";
    case "SingleUp":
      return "↑";
    case "NotComputable":
      return "?";
    default:
      return "";
  }
};
