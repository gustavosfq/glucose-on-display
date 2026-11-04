<div align="center">

# 🩸 Glucose on Display

**Tu glucosa siempre a la vista, en la barra de menú de tu Mac.**

![macOS](https://img.shields.io/badge/macOS-Apple%20Silicon-000000?logo=apple&logoColor=white)
![Electron](https://img.shields.io/badge/Electron-35-47848F?logo=electron&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)
![Versión](https://img.shields.io/badge/versión-1.2.0-brightgreen)

</div>

---

Glucose on Display lee tus datos de **FreeStyle Libre** a través de LibreLinkUp y muestra el valor actual con su tendencia directamente en la barra de menú:

```
 🍎  Finder  Archivo  Edición        120 →   🔋  📶  14:32
```

Sin abrir el celular ni ninguna app: un vistazo y listo.

## ✨ Características

- **📊 Glucosa en tiempo real**: valor en mg/dL con flecha de tendencia (`↑ ↗ → ↘ ↓`), actualizado cada 2 minutos.
- **🎨 Color según rango**: verde entre 70 y 180 mg/dL, rojo fuera de ese rango.
- **🔔 Alertas inteligentes**:
  | Alerta | Se activa cuando | Se repite cada |
  |---|---|---|
  | 🚨 Crítica alta | ≥ 250 mg/dL | 10 min |
  | 🚨 Crítica baja | ≤ 55 mg/dL | 10 min |
  | ⚠️ Alta | > 180 mg/dL | 30 min |
  | ⚠️ Baja | < 70 mg/dL | 30 min |
  | 📈 Subida rápida | > 3 mg/dL por minuto | 30 min |
  | 📉 Bajada rápida | > 3 mg/dL por minuto | 30 min |
- **🔕 Snooze**: pausa las alertas 30 min, 1 h o 2 h desde el menú.
- **🧪 Modo prueba**: dispara cada tipo de alerta desde el menú para ver cómo se ve.
- **🛡️ Protección de la cuenta**: limita los reintentos de login para evitar bloqueos de LibreLinkUp.

Los detalles del sistema de alertas están en [ALERTS.md](ALERTS.md).

## 📋 Requisitos

- macOS con Apple Silicon (M1 o posterior)
- Un sensor **FreeStyle Libre** que comparta datos con **LibreLinkUp**
- Una cuenta de LibreLinkUp (correo y contraseña)

> [!TIP]
> Si todavía no usas LibreLinkUp: en la app **FreeStyle LibreLink** ve a *Compartir → Conexiones* e invita a tu propio correo. Luego crea la cuenta en la app **LibreLinkUp** y acepta la invitación.

## 🚀 Instalación

1. Descarga el `.dmg` desde [Releases](https://github.com/gustavosfq/glucose-on-display/releases) o compílalo tú mismo (ver abajo).
2. Arrastra **GlucoseOnDisplay** a *Aplicaciones*.
3. La app no está firmada, así que la primera vez ábrela con **clic derecho → Abrir**. Si macOS la sigue bloqueando:
   ```bash
   xattr -cr /Applications/GlucoseOnDisplay.app
   ```
4. Haz clic en el icono de la barra de menú → **Configuración** e ingresa tus credenciales de LibreLinkUp.

## 🛠️ Desarrollo

```bash
# Instalar dependencias
npm install

# Compilar y ejecutar en modo desarrollo
npm run dev

# Generar la app y el instalador .dmg
npm run compile && npm run build
```

El instalador queda en `dist/GlucoseOnDisplay-<versión>-arm64.dmg`.

### Estructura del proyecto

```
src/
├── index.ts               # Proceso principal: tray, menú, ventanas, polling
├── preload.ts             # Puente IPC con las ventanas
├── index.html             # Ventana de configuración (login)
├── alert.html             # Ventana de alerta
├── glucoseClient/         # Cliente de LibreLinkUp con control de reintentos
├── config/regions.ts      # Regiones de LibreLinkUp
└── utils/
    ├── canvas.ts          # Dibuja el valor como icono del tray
    ├── notifications.ts   # Motor de alertas y snooze
    └── storage.ts         # Persistencia local
```

## 🔒 Privacidad

- Tus credenciales **no salen de tu Mac**, salvo hacia los servidores de LibreLinkUp para iniciar sesión.
- Se guardan localmente en `~/Library/Application Support/glucose-on-display/data.json`. Por ahora se guardan **sin cifrar**, así que úsala solo en un equipo de confianza.

## ⚠️ Aviso importante

> [!WARNING]
> Este es un proyecto personal, **no oficial**, y no tiene relación con Abbott ni con FreeStyle Libre. Usa una API no oficial que puede dejar de funcionar en cualquier momento.
>
> **No es un dispositivo médico.** No tomes decisiones de tratamiento basándote solo en esta app. Usa siempre tu lector o app oficial y sigue las indicaciones de tu médico.

## 🙏 Créditos

- [libre-link-unofficial-api](https://www.npmjs.com/package/libre-link-unofficial-api) para la conexión con LibreLinkUp
- [Electron](https://www.electronjs.org/) y [node-canvas](https://github.com/Automattic/node-canvas)

## 📄 Licencia

ISC
