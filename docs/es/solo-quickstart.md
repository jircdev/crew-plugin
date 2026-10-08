# Quickstart solo

El camino del CTO: sos una sola persona construyendo un producto, querés los roles y la historia del crew sin la ceremonia que necesita un equipo. Una página, de punta a punta.

## 1. Instalar el plugin

Seguí la [guía de instalación](installation.md). En una terminal:

```
claude plugin marketplace add jircdev/crew-plugin
claude plugin install crew@factory-crew
```

Para Codex, ver [compatibilidad](compatibility.md#instalar-en-codex).

## 2. Inicializar el repo en modo solo

Desde la raíz de tu repo:

```
bash <plugin>/scripts/init-project.sh --solo
```

donde `<plugin>` es la ruta donde está instalado el plugin. También podés pedírselo a la crew: "configura la estructura de la crew en este proyecto, en modo solo". Esto scaffoldea:

- `AGENTS.md` — el protocolo de activación y la tabla de alias, para que `SYS:`, `UX:`, etc. funcionen en este proyecto.
- `CLAUDE.md` — un puntero a `AGENTS.md` para Claude.
- `standards/` — el baseline de calidad de código.
- `docs/decisions/` — ADRs.
- `docs/work/` — la historia de qué se hizo, quién y por qué.
- `docs/design/` y `docs/guides/testing.md` — la memoria de diseño y la estrategia de testing, vacías para que las completes.
- `crew.json` — con `mode: solo`, `metrics: true`, `quality: advise`.

Los archivos existentes nunca se sobrescriben.

## 3. Qué apaga el modo solo

La ceremonia del circuito de entrega diseñada para coordinar a varias personas:

- **No se exigen stories ni briefs.** Podés pedirle a cualquier rol que construya directamente.
- **Los ítems Closed siguen siendo editables.** La inmutabilidad es una protección de equipo; en solitario, tu historia es tuya para corregirla.
- **Sin recordatorio de work-log al cerrar la sesión.** Nada te obliga a dejar el rastro que necesitaría un traspaso entre personas.

## 4. Qué queda

- **El catálogo completo de roles, a demanda.** `/crew:sys` para arquitectura, `/crew:qa` para un veredicto de testing, `/crew:ux` antes de codear UI — todos los roles, misma invocación, cuando quieras esa mirada.
- **La historia en `docs/work/`.** Las sesiones siguen dejando registro de qué cambió y por qué.
- **Calidad de código en modo advise + el gate de pre-commit.** Los hallazgos se reportan; las exenciones se pre-registran con `crew:exempt` en `docs/DEVIATIONS.md`.

## 5. Métricas, en solitario

Las métricas son opt-in por ítem de trabajo: creá un ítem en `docs/stories/` o `docs/requirements/` cuando quieras medir un trabajo — y omitilo cuando no.

- Agregale al ítem la **tabla `## Estimation`** estándar al tomarlo (la plantilla no la trae); completá el estimado antes de empezar.
- Con `metrics: true`, el guard exige **timestamps escritos en tiempo real**, en el momento en que realmente empezás y terminás.
- Corré `/crew:metrics` para el reporte: estimado vs. real, por ítem y agregado.

## Pasar a team más adelante

El modo solo es la misma estructura con la ceremonia apagada. Cuando se suma gente: editá `crew.json` (`mode: team`), volvé a correr `init-project.sh` para scaffoldear las piezas restantes, y el circuito de entrega — stories, gate de Ready, ítems Closed inmutables — se enciende sobre la historia que ya tenés.
