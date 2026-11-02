# 001 — Token vencido sin pérdida de tiempo

- **Status:** Delivered
- **Plan:** factory-onboarding ([README](README.md))
- **Date:** 2026-11-02
- **Author role:** SYS, con SEC en consentimiento
- **Branch:** main (the plugin ships from main; no feature branch)
- **Depends on:** —

## Context

Cuando factory rechaza el token (HTTP 401), el plugin borra la cola local completa y deja de capturar. Así se perdió el tiempo de Julio del 2026-10-30 al 2026-11-02. Factory devuelve el mismo 401 cuando el token venció (a los 90 días, sin que la persona lo decida) y cuando la persona lo revocó (su forma de pausar la captura).

Dos defectos del estado local afectan a los avisos de 003: la limpieza de sesiones viejas borra `status.json`, y cada envío reescribe la hora del problema, así que no se sabe desde cuándo dura.

## Goal

- El login guarda, junto al token, su fecha de vencimiento, la fecha de conexión, la persona y el entorno de factory que lo emitió. Nada de eso es secreto, y el archivo es solo del dueño.
- Un 401 posterior al vencimiento conserva la cola dentro de los 45 días de retención y marca el estado como vencido.
- Un 401 anterior al vencimiento se trata como revocación: se borra todo, como hoy.
- Mientras el token está vencido se sigue registrando tiempo localmente, y se envía tras el próximo login. Mientras está revocado no se registra nada.
- Un login exitoso envía la cola enseguida, solo si factory confirma que es la misma persona en el mismo entorno. Si no coincide, la cola se descarta y se avisa.
- Siete días antes del vencimiento queda un estado de "vence pronto" para que 003 avise.
- `~/.crew/activity/` y sus archivos quedan solo para el dueño (0700/0600; en Windows, ACL del dueño sin herencia).
- La limpieza de sesiones viejas deja de borrar `status.json`, y el estado guarda desde cuándo dura un problema.

## Areas to investigate

- **Decidido por Julio el 2026-11-02:** el tiempo trabajado después del vencimiento se registra localmente, porque vencer no es retirar el consentimiento. SEC pidió que el texto de consentimiento lo diga: la documentación del plugin lo dice desde este requirement, y la página de aprobación de factory necesita la misma frase (cambio en el repo de factory).
- Tokens creados a mano (sin login) no tienen fecha de vencimiento guardada: un 401 en ese caso se trata como revocación.

## Expected deliverable

- Metadatos del token en `hooks/lib/factory.js` y su escritura en el login.
- Manejo del 401 en `hooks/lib/activity-queue.js` según vencimiento o revocación.
- Envío de la cola tras el login, con la verificación de persona y entorno.
- Permisos de la carpeta de actividad y los dos defectos del estado.
- Tests y documentación (`docs/en/factory.md`, `docs/es`).

## Estimation

| Milestone | Est. hours | Est. AI hours | Started | Finished | Actual hours | Actual AI hours | Notes |
|-----------|-----------|---------------|---------|----------|--------------|-----------------|-------|
| Metadatos del token al hacer login | 1.5 | 0.25 | — | 2026-11-02 14:18 -03:00 | — | — | saveToken guarda vencimiento, fecha de conexión, persona y api en factory-token.json. Inicio no registrado en el momento |
| 401 por vencimiento frente a revocación | 2 | 0.25 | — | 2026-11-02 14:18 -03:00 | — | — | tokenState() en hooks/lib/factory.js. Inicio no registrado en el momento |
| Envío de la cola tras el login, misma persona y entorno | 1.5 | 0.25 | — | 2026-11-02 14:18 -03:00 | — | — | scripts/lib/factory-connect.js; persona por whoami, o por el nombre de /self. Inicio no registrado en el momento |
| Permisos de la carpeta y defectos del estado | 1.5 | 0.25 | — | 2026-11-02 14:18 -03:00 | — | — | restrictToOwner; status.json con since; la limpieza ya no lo borra. Inicio no registrado en el momento |
| Tests | 1.5 | 0.25 | — | 2026-11-02 14:18 -03:00 | — | — | tests/factory-expiry.test.js, 7 casos; simulador compartido en tests/fixtures/factory-fake.js. Inicio no registrado en el momento |
| Docs EN y ES | 0.5 | 0.25 | — | 2026-11-02 14:33 -03:00 | — | — | docs/en/factory.md y docs/es/factory.md. Inicio no registrado en el momento |
| Revisión de Julio | 0.5 | 0 | | | | | |
| **Total** | **9** | **1.5** | — | — | | | |

## Verification

| Scenario | Level | Harness | Artifact | Status |
|----------|-------|---------|----------|--------|
| Un 401 después del vencimiento conserva la cola y marca vencido | integration | node:test | tests/factory-expiry.test.js | passing |
| Un 401 antes del vencimiento borra la cola, como hoy | integration | node:test | tests/factory-expiry.test.js | passing |
| Un login de la misma persona y entorno envía la cola | integration | node:test | tests/factory-expiry.test.js | passing |
| Un login de otra persona o entorno no envía la cola | integration | node:test | tests/factory-expiry.test.js | passing |
| La limpieza de sesiones conserva status.json | unit | node:test | tests/capture-activity.test.js | passing |
| La carpeta de actividad queda solo del dueño | integration | node:test | tests/factory-expiry.test.js | passing |

## Changes
