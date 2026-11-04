import { app, BrowserWindow, Tray, Menu, ipcMain } from "electron";

import { createTextTrayIcon } from "./utils/canvas";
import { alertManager } from "./utils/notifications";
import path from "path";
import { dataStore } from "./utils/storage";
import { GlucoseClient } from "./glucoseClient";

let tray: Tray | null = null;
let win: BrowserWindow | null = null;
let alertWin: BrowserWindow | null = null;
let client: GlucoseClient | null = null;

const login = async () => {
  const username = await dataStore.getValue("username");
  const password = await dataStore.getValue("password");
  if (!username || !password) {
    console.error("Username or password not set");
    return;
  }
  client = new GlucoseClient(username, password);
  readData();
}

const readData = async () => {
  try {
    const response = await client?.read();
    if (response) {
      tray?.setImage(createTextTrayIcon(response));
      if (response.data) {
        await alertManager.checkAlerts(response.data);
      }
    } else {
      console.error("Response is undefined during interval");
    }
  } catch (error) {
    console.error("Error reading glucose data during interval:", error);
  }
}

app.whenReady().then(async () => {
  await login();
  
  // Ventana de configuración
  const win = new BrowserWindow({
    width: 500,
    height: 500,
    show: false,
    frame: false,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  win.loadFile(path.join(__dirname, "../build/index.html"));
  
  ipcMain.on("close", (event) => {
    console.log("close");
    win.hide();
  });

  ipcMain.handle('getValue', (_e, key) => {
    console.log('getValue', key);
    return dataStore.getValue(key);
  });
  
  ipcMain.on('setValue', (_e, { key, value }) => {
    console.log('setValue', key, value);
    dataStore.setValue(key, value);
  });

  ipcMain.on('login', (_event, valor) => {
    login().then(() => {}).catch((error) => {
      console.error("Error logging in:", error);
    });
  });

  // Handlers para alertas
  ipcMain.handle('getAlertConfig', async () => {
    return await alertManager.getConfig();
  });

  ipcMain.on('setAlertConfig', async (_event, config) => {
    await alertManager.saveConfig(config);
  });

  ipcMain.on('snoozeAlerts', (_event, minutes) => {
    alertManager.snooze(minutes);
    updateContextMenu();
  });

  ipcMain.handle('getAlertStatus', () => {
    return alertManager.getStatus();
  });

  // Handlers para ventana de alerta
  let currentAlertData: any = null;

  ipcMain.handle('getAlertData', () => {
    return currentAlertData;
  });

  ipcMain.on('dismissAlert', () => {
    alertWin?.hide();
    currentAlertData = null;
  });

  ipcMain.on('snoozeAlert', (_event, minutes) => {
    alertManager.snooze(minutes);
    alertWin?.hide();
    currentAlertData = null;
    updateContextMenu();
  });

  // Función para mostrar ventana de alerta
  const showAlertWindow = (alertData: any) => {
    currentAlertData = alertData;
    
    if (!alertWin) {
      alertWin = new BrowserWindow({
        width: 500,
        height: 400,
        show: false,
        frame: false,
        resizable: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        transparent: false,
        webPreferences: {
          nodeIntegration: true,
          preload: path.join(__dirname, "preload.js"),
        },
      });

      alertWin.loadFile(path.join(__dirname, "alert.html"));

      alertWin.on('ready-to-show', () => {
        alertWin?.show();
        alertWin?.focus();
        alertWin?.webContents.send('showAlert', currentAlertData);
      });
    } else {
      alertWin.webContents.send('showAlert', currentAlertData);
      alertWin.show();
      alertWin.focus();
    }
  };

  // Exportar la función para que el alertManager pueda usarla
  (global as any).showAlertWindow = showAlertWindow;



  const iconImage = createTextTrayIcon({ value: "?", color: "red" });
  tray = new Tray(iconImage);
  tray.setToolTip("Glucosa");

  const updateContextMenu = () => {
    const alertStatus = alertManager.getStatus();
    const contextMenu = Menu.buildFromTemplate([
      {
        label: "Configuración",
        click: () => {
          win?.show();
        },
      },
      { type: "separator" },
      {
        label: alertStatus.isSnoozed ? "🔕 Alertas pausadas" : "🔔 Alertas activas",
        enabled: false,
      },
      {
        label: alertStatus.isSnoozed ? "Reactivar alertas" : "Pausar alertas (30 min)",
        click: () => {
          if (alertStatus.isSnoozed) {
            alertManager.snooze(0);
          } else {
            alertManager.snooze(30);
          }
          updateContextMenu();
        },
      },
      {
        label: "Pausar alertas (1 hora)",
        click: () => {
          alertManager.snooze(60);
          updateContextMenu();
        },
      },
      {
        label: "Pausar alertas (2 horas)",
        click: () => {
          alertManager.snooze(120);
          updateContextMenu();
        },
      },
      { type: "separator" },
      {
        label: "🧪 Probar Alertas",
        submenu: [
          {
            label: "🚨 Crítica Alta (≥250)",
            click: () => {
              const showAlert = (global as any).showAlertWindow;
              if (showAlert) {
                showAlert({
                  type: "critical-high",
                  title: "⚠️ GLUCOSA CRÍTICA ALTA",
                  body: "Tu glucosa está en 280 mg/dL. Toma acción inmediatamente.",
                  value: 280,
                  trend: "SingleUp",
                });
              }
            },
          },
          {
            label: "🚨 Crítica Baja (≤55)",
            click: () => {
              const showAlert = (global as any).showAlertWindow;
              if (showAlert) {
                showAlert({
                  type: "critical-low",
                  title: "⚠️ GLUCOSA CRÍTICA BAJA",
                  body: "Tu glucosa está en 45 mg/dL. Come algo ahora.",
                  value: 45,
                  trend: "SingleDown",
                });
              }
            },
          },
          {
            label: "⚠️ Alta (>180)",
            click: () => {
              const showAlert = (global as any).showAlertWindow;
              if (showAlert) {
                showAlert({
                  type: "high",
                  title: "Glucosa Alta",
                  body: "Tu glucosa está en 220 mg/dL",
                  value: 220,
                  trend: "FortyFiveUp",
                });
              }
            },
          },
          {
            label: "⚠️ Baja (<70)",
            click: () => {
              const showAlert = (global as any).showAlertWindow;
              if (showAlert) {
                showAlert({
                  type: "low",
                  title: "Glucosa Baja",
                  body: "Tu glucosa está en 60 mg/dL",
                  value: 60,
                  trend: "FortyFiveDown",
                });
              }
            },
          },
          {
            label: "📈 Subida Rápida",
            click: () => {
              const showAlert = (global as any).showAlertWindow;
              if (showAlert) {
                showAlert({
                  type: "rapid-rise",
                  title: "Subida Rápida",
                  body: "Tu glucosa está subiendo rápido: 160 mg/dL (4.5 mg/dL/min)",
                  value: 160,
                  trend: "SingleUp",
                  rate: 4.5,
                });
              }
            },
          },
          {
            label: "📉 Bajada Rápida",
            click: () => {
              const showAlert = (global as any).showAlertWindow;
              if (showAlert) {
                showAlert({
                  type: "rapid-fall",
                  title: "Bajada Rápida",
                  body: "Tu glucosa está bajando rápido: 110 mg/dL (4.2 mg/dL/min)",
                  value: 110,
                  trend: "SingleDown",
                  rate: -4.2,
                });
              }
            },
          },
        ],
      },
      { type: "separator" },
      { label: "Salir", click: () => app.quit() },
    ]);
    tray?.setContextMenu(contextMenu);
  };

  updateContextMenu();

  if (client) {
    readData();
  } else {
    console.error("Client is not initialized");
  }

  setInterval(async () => {
    if (!client) {
      console.error("Client is not initialized during interval");
      return;
    }
    readData();
    updateContextMenu(); // Actualizar el menú con el estado de las alertas
  }, 1000 * 60 * 2); // Update every 2 minutes
});
