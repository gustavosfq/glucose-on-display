# 🔔 Sistema de Alertas de Glucosa

## Características Implementadas

### ✅ Tipos de Alertas

1. **Alerta Crítica Alta (⚠️)**
   - Se activa cuando la glucosa >= 250 mg/dL
   - Notificación urgente con prioridad crítica
   - No se repite hasta después de 10 minutos

2. **Alerta Crítica Baja (⚠️)**
   - Se activa cuando la glucosa <= 55 mg/dL
   - Notificación urgente con prioridad crítica
   - No se repite hasta después de 10 minutos

3. **Alerta Alta**
   - Se activa cuando la glucosa > 180 mg/dL
   - Notificación normal
   - No se repite hasta después de 30 minutos

4. **Alerta Baja**
   - Se activa cuando la glucosa < 70 mg/dL
   - Notificación normal
   - No se repite hasta después de 30 minutos

5. **Alerta de Subida Rápida (📈)**
   - Se activa cuando la glucosa sube > 3 mg/dL por minuto
   - Muestra la tasa de cambio
   - No se repite hasta después de 30 minutos

6. **Alerta de Bajada Rápida (📉)**
   - Se activa cuando la glucosa baja > 3 mg/dL por minuto
   - Muestra la tasa de cambio
   - No se repite hasta después de 30 minutos

### 🔕 Sistema de Snooze

Desde el menú del tray icon puedes pausar las alertas:
- **30 minutos** - Pausa rápida
- **1 hora** - Pausa media
- **2 horas** - Pausa extendida
- **Reactivar** - Quita la pausa en cualquier momento

El menú muestra:
- 🔔 Alertas activas
- 🔕 Alertas pausadas (cuando están en snooze)

### ⚙️ Configuración Personalizable

Las alertas se pueden configurar con estos parámetros:

```typescript
{
  highThreshold: 180,           // Umbral alto (mg/dL)
  lowThreshold: 70,             // Umbral bajo (mg/dL)
  criticalHighThreshold: 250,   // Umbral crítico alto (mg/dL)
  criticalLowThreshold: 55,     // Umbral crítico bajo (mg/dL)
  rapidRiseThreshold: 3,        // Subida rápida (mg/dL/min)
  rapidFallThreshold: 3,        // Bajada rápida (mg/dL/min)
  enableHighAlerts: true,       // Activar alertas altas
  enableLowAlerts: true,        // Activar alertas bajas
  enableTrendAlerts: true,      // Activar alertas de tendencia
  enableSoundAlerts: true,      // Activar sonidos
  snoozeTime: 30,              // Tiempo de snooze por defecto (min)
}
```

### 🔊 Sonidos

- Las alertas críticas usan sonidos del sistema con urgencia "critical"
- Las alertas normales usan urgencia "normal"
- Los sonidos se pueden desactivar con `enableSoundAlerts: false`

### 🧠 Inteligencia

- **Prevención de spam**: No repite la misma alerta muy seguido
- **Cálculo de tendencias**: Usa lecturas previas para calcular la tasa de cambio
- **Persistencia**: La configuración se guarda en el almacenamiento local
- **Estado de snooze**: Se mantiene entre ejecuciones

### 📝 Logs

Todas las alertas se registran en la consola:
- `🔔 Alert:` cuando se envía una alerta
- `🔕 Alerts are snoozed` cuando están pausadas
- `🔕 Alerts snoozed for X minutes` cuando se activa el snooze

## Uso

### Desde el Tray Menu

1. Haz clic derecho en el icono del tray
2. Verás el estado de las alertas
3. Selecciona el tiempo de pausa o reactiva

### Desde Código (API)

```typescript
import { alertManager } from './utils/notifications';

// Verificar alertas
await alertManager.checkAlerts({
  value: 120,
  trend: 'Flat',
  timestamp: new Date()
});

// Pausar alertas
alertManager.snooze(30); // 30 minutos

// Obtener configuración
const config = await alertManager.getConfig();

// Guardar configuración
await alertManager.saveConfig({
  highThreshold: 200,
  enableTrendAlerts: false
});

// Obtener estado
const status = alertManager.getStatus();
console.log(status.isSnoozed); // true/false
```

## Próximas Mejoras

- [ ] Panel de configuración visual en la UI
- [ ] Historial de alertas
- [ ] Estadísticas de alertas
- [ ] Sonidos personalizados
- [ ] Integración con otros servicios (email, SMS, etc.)
- [ ] Alertas basadas en patrones (ej: siempre bajo después de ejercicio)
