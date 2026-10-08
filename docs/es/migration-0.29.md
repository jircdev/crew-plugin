# Migración a 0.29 — una instalación diagnosticable, adopción de código existente y un escaneo de seguridad

Aditiva. **No requiere ninguna acción.**

## Qué cambió, en un párrafo

El scaffold pasó a `scripts/init-project.js` (`init-project.sh` sigue funcionando y lo envuelve), sumó `--dry-run` y `--json`, y ahora registra cada archivo que escribe en `.crew/install-state.json`. `/crew:doctor` lee ese registro junto con `crew.json`, `migrations.json`, la puerta pre-commit y `docs/DEVIATIONS.md`, y reporta con la forma de hallazgos; `repair` y `uninstall` tocan solo archivos registrados que el proyecto nunca editó. `/crew:adopt` extrae lo que hace un sistema existente en `docs/as-is/`, y el doctor marca esos archivos como desactualizados cuando cambia su código. `security-compliance` escanea la configuración del agente con `scripts/sec-scan.js`, de solo lectura y sin red, y el inicio de sesión avisa cuando la configuración cambió desde el último escaneo.

## Qué podés notar

- Los proyectos generados antes de la 0.29 no tienen `.crew/install-state.json`. El doctor funciona sin él; `repair` y `uninstall` no tienen nada registrado sobre qué actuar. Volver a correr `scripts/init-project.sh` registra solo los archivos que escriba desde ahora: nunca se adueña de archivos que ya existían.
- En proyectos con crew aparece un aviso de **seguridad** de una línea al iniciar sesión hasta que se archiva un escaneo con `--report`.
- `"audit": true` (team) inicia un registro de solo agregado de las decisiones de los guards en `.crew/audit.log`.

## Qué no hace falta hacer

- Nada cambia en `crew.json` salvo que actives `audit`.
- La carpeta as-is se crea solo en scaffolds team nuevos; `/crew:adopt` la crea cuando hace falta.
