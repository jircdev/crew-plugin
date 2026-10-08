# Migración a 0.30 — un catálogo que aprende, con gobierno

Aditiva. **No requiere ninguna acción.**

## Qué cambió, en un párrafo

Ahora se puede registrar el uso del catálogo (qué roles, skills y comandos usa de verdad un proyecto), pero solo para la persona que lo activa (`.crew/local.json` con `{"telemetry": true}`, o `CREW_TELEMETRY=1`). El `crew.json` compartido no puede encenderlo para un equipo; `"telemetry": false` lo prohíbe para todos. El registro guarda una fecha, un tipo y un nombre del catálogo por evento, nada más, durante 90 días, y nunca llega al repositorio. `/crew:metrics catalog` lo informa. El documentation steward suma una retro, que corre solo a pedido y convierte la fricción repetida en archivos del repo en propuestas sin dueño para que una persona las apruebe. Los scripts de shell quedan fijados a finales de línea LF, así un checkout en Windows ya no convierte `check-quality.sh` en un script que bash no puede correr.

## Qué podés notar

- `/crew:doctor` bloquea si `.crew/usage.jsonl`, `.crew/local.json` o `.crew/audit.log` están bajo control de versiones.
- En un checkout del plugin en Windows hecho antes de la 0.30, volvé a hacer checkout de los `.sh` (o cloná de nuevo) para tener finales LF.
