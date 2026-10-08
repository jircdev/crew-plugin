# Configurar crew 1.0 después de instalarlo

Esta guía es para un proyecto que ya usaba crew y se pasa a la 1.0. La 1.0 junta todo lo que se construyó entre la 0.26 y la 0.31; ninguna de esas versiones se publicó, así que si venías de la 0.25 o de antes, este es el único documento que necesitás. Lleva unos 15 minutos por proyecto.

Para un proyecto nuevo, empezá por [installation.md](installation.md). El detalle de cada cambio está en el [CHANGELOG](../../CHANGELOG.md).

## Antes de empezar

- Node.js 22 o más, Git, y Bash para la puerta pre-commit (Git Bash en Windows).
- Claude Code, o Codex 0.130 o más. Las versiones verificadas son Claude Code 2.1.227 y Codex 0.130.0-alpha.5.

## 1. Actualizar el plugin

- **Claude Code:** `/plugin update crew@factory-crew` y abrí una sesión nueva.
- **Codex:** seguí [compatibility.md § Instalar en Codex](compatibility.md#instalar-en-codex). En Codex 0.130 ya no existe `codex plugin add`.

## 2. Solo en Codex: activar los hooks

Sin este paso, Codex carga las skills de crew pero no corre **ningún** guard ni la captura de tiempo.

1. En `config.toml` de Codex, agregá `[features]` con `plugin_hooks = true` (o abrí Codex con `--enable plugin_hooks`).
2. Abrí `/hooks` y confiá en los hooks de crew. Cada cambio en un hook pide confiar de nuevo.

## 3. Diagnosticar el proyecto

Desde la raíz del proyecto, en el chat:

```
/crew:doctor
```

El doctor revisa `crew.json`, la puerta pre-commit, las migraciones pendientes, las excepciones vencidas y los work items que se apartan de su estándar. No cambia nada. Resolvé primero lo que marque como `blocking`.

## 4. Configurar lo nuevo

```
/crew:setup
```

La entrevista pregunta solo lo que falta y escribe solo lo que confirmás. Lo nuevo de la 1.0 que te va a ofrecer:

| Pregunta | Qué activa |
|---|---|
| ¿Un `passing` necesita un recibo de la corrida? | `testing.receipts`: el cierre exige el recibo que deja `/crew:check` |
| ¿El proyecto lleva sus tareas y su tiempo en factory? | El bloque `factory` y el modo factory ([factory.md](factory.md)) |
| ¿Querés un registro de lo que deciden los guards? (equipo) | `audit`: una línea por decisión en `.crew/audit.log` |
| ¿Se prohíbe medir el uso del catálogo? (equipo) | `"telemetry": false` |
| ¿Querés contar tu propio uso de roles y skills? (persona) | `.crew/local.json`, que git ignora |

Si alguna respuesta baja un control (por ejemplo, `quality` de `enforce` a `advise`), setup primero la registra en `docs/DEVIATIONS.md` con tu motivo.

## 5. Revisar tus plantillas

Las plantillas de tu proyecto (`docs/stories/README.md`, `docs/requirements/README.md`) no cambian solas. Desde la 1.0 son tu estándar: crew valida cada story y cada requirement contra ellas al escribir. Para ver el estándar que se aplica a una ruta:

```
node <plugin>/scripts/conformance.js docs/requirements/<plan>/001-x.md
```

Las plantillas de crew suman tres cosas que podés copiar a las tuyas si te sirven: la sección `## Must not` en las stories, y los campos opcionales `**Size:**` y `**Factory activity:**`.

## 6. Registrar las excepciones

`docs/DEVIATIONS.md` tiene ahora cuatro bloques. Cada línea lleva su motivo y puede llevar `owner:` y `expires:`.

| Bloque | Para qué |
|---|---|
| `crew:exempt` | Rutas exentas del límite de tamaño de archivo |
| `crew:standard` | Desvíos deliberados de la plantilla de work items |
| `crew:policy` | Controles relajados a propósito en `crew.json` o en los settings |
| `crew:security` | Riesgos aceptados del escaneo de seguridad |

El detalle está en [enforcement.md](enforcement.md).

## 7. Escanear la configuración del agente

Pedile a `security-compliance` que corra el escaneo, o corrélo vos:

```
node <plugin>/scripts/sec-scan.js --report
```

Revisa instrucciones, settings, servidores MCP, hooks y agentes del proyecto. No usa red y enmascara los secretos. Hasta que haya un informe en `docs/security/`, cada sesión lo recuerda con una línea.

## 8. Si el proyecto usa factory

Cada persona conecta su máquina una vez:

```
/crew:factory login
```

Sin ese paso no se registra nada sobre esa persona. El detalle está en [factory.md](factory.md).

## Qué cambia en el día a día

| Situación | Desde la 1.0 |
|---|---|
| Un agente corre `git commit --no-verify` | Se niega en todo proyecto con `crew.json` |
| Un agente baja `quality` o apaga hooks | Se niega en `team` con `enforce`, salvo que esté en `crew:policy` |
| Un work item no sigue su plantilla | Se avisa al escribir; se niega en `team` con `enforce` |
| Pedís un plan o una estimación | El plan se escribe primero como work items en el repo |
| Abrís una sesión | Ves los hitos abiertos y los items que esperan validación |
| Una revisión de QA o de diseño | Los hallazgos traen severidad, rol dueño y evidencia |

## Si algo sale mal

- Un guard te bloqueó: el mensaje nombra la causa; [enforcement.md](enforcement.md) explica cada uno y cómo resolverlo.
- Algo no está como esperabas: `/crew:doctor`.
- Querés deshacer la instalación en un proyecto: `/crew:doctor uninstall`, primero con `--dry-run`.
