import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
  sendEvent: (channel: string, data: any) => {
    ipcRenderer.send(channel, data);
  },
  onEvent: (channel: string, callback: (event: any, data: any) => void) => {
    ipcRenderer.on(channel, callback);
  },
  invoke: (channel: string, data: any) => {
    return ipcRenderer.invoke(channel, data);
  },
  close: () => {
    ipcRenderer.send("close");
  }
});

contextBridge.exposeInMainWorld("store", {
  set: (key: string, value: any) =>
    ipcRenderer.send("setValue", { key, value }),
  get: (key: string) => ipcRenderer.invoke("getValue", key),
});

contextBridge.exposeInMainWorld("alerts", {
  getConfig: () => ipcRenderer.invoke("getAlertConfig"),
  setConfig: (config: any) => ipcRenderer.send("setAlertConfig", config),
  snooze: (minutes: number) => ipcRenderer.send("snoozeAlerts", minutes),
  getStatus: () => ipcRenderer.invoke("getAlertStatus"),
});
