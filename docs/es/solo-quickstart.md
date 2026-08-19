# Quickstart solo

El camino del CTO: sos una sola persona construyendo un producto, querés los roles y la historia del crew sin la ceremonia que necesita un equipo. Una página, de punta a punta.

## 1. Instalar el plugin

Seguí la [guía de instalación](installation.md). Un comando en Claude Code:

```
/plugin install crew
```

## 2. Inicializar el repo en modo solo

Desde la raíz de tu repo:

```
bash <plugin>/scripts/init-project.sh --solo
```

donde `<plugin>` es la ruta donde Claude Code instaló el plugin. Esto scaffoldea:

- `AGENTS.md` — el protocolo de activación y la tabla de alias, para que `SYS:`, `UX:`, etc. funcionen en cualquier sesión.
- `CLAUDE.md` — instrucciones a nivel de sesión.
- `standards/` — el baseline de calidad de código.
- `docs/decisions/` — ADRs.
- `docs/work/` — la historia de qué se hizo, quién y por qué.
- `crew.json` — con `mode: solo`, `metrics: true`, `quality: advise`.

Los archivos existentes nunca se sobrescriben.

## 3. Qué apaga el modo solo

La ceremonia del circuito de entrega diseñada para coordinar a varias personas:

- **No se exigen stories ni briefs.** Podés pedirle a cualquier rol que construya directamente.
- **Los ítems Closed siguen siendo editables.** La inmutabilidad es una protección de equipo; en solitario, tu historia es tuya para corregirla.
- **Sin bloque de closure-trace.** Nada obliga al rastro documental que necesitaría un traspaso.

## 4. Qué queda

- **El catálogo completo de roles, a demanda.** `/crew:sys` para arquitectura, `/crew:qa` para un veredicto de testing, `/crew:ux` antes de codear UI — todos los roles, misma invocación, cuando quieras esa mirada.
- **La historia en `docs/work/`.** Las sesiones siguen dejando registro de qué cambió y por qué.
- **Calidad de código en modo advise + el gate de pre-commit.** Los hallazgos se reportan; las exenciones se pre-registran con `crew:exempt` en `docs/DEVIATIONS.md`.

## 5. Métricas, en solitario

Las métricas son opt-in por ítem de trabajo: creá un ítem en `docs/stories/` o `docs/requirements/` cuando quieras medir un trabajo — y omitilo cuando no.

- Agregale al ítem la **tabla `## Estimation`** estándar al tomarlo (la plantilla no la trae); completá el estimado antes de empezar.
- Con `metrics: true`, el guard exige **timestamps escritos en tiempo real** — cuando realmente empezás y terminás, no reconstruidos después.
- Corré `/crew:metrics` para el reporte: estimado vs. real, por ítem y agregado.

## Pasar a team más adelante

El modo solo no es un fork — es la misma estructura con la ceremonia apagada. Cuando se suma gente: editá `crew.json` (`mode: team`), volvé a correr `init-project.sh` para scaffoldear las piezas restantes, y el circuito de entrega — stories, gate de Ready, ítems Closed inmutables — se enciende sobre la historia que ya tenés.
