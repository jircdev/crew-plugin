# Contribuir y mantenimiento

## Estructura de carpetas

```
crew-plugin/
├── .claude-plugin/
│   ├── plugin.json
│   └── marketplace.json
├── agents/
│   ├── product-strategist.md
│   ├── functional-analyst.md
│   ├── system-architect.md
│   ├── ... (24 en total)
├── commands/
│   ├── prod.md
│   ├── fa.md
│   ├── sys.md
│   ├── ... (24 en total)
├── hooks/
│   ├── hooks.json            # registra los dos hooks de abajo
│   ├── session-start.js      # SessionStart: inyecta standards/session-context.md
│   └── guard-immutable.js    # PreToolUse: deniega ediciones a artefactos inmutables
├── standards/
│   └── session-context.md    # baseline de sesión siempre activo (defaults sugeridos)
├── templates/
│   ├── AGENTS.md             # contexto canónico de agentes (precedencia, mapa de propiedad, interop)
│   ├── CLAUDE.md             # puntero fino @AGENTS.md
│   ├── .cursor/rules/
│   │   ├── general.mdc
│   │   ├── communication.mdc
│   │   └── code-quality.mdc  # núcleo universal (sugerido; las reglas del proyecto ganan)
│   ├── .cursor/rules-stack-examples/
│   │   ├── code-quality-tauri-react.mdc
│   │   ├── frontend-tauri-react.mdc
│   │   ├── rust-core.mdc
│   │   └── node-sidecar.mdc
│   └── docs/                 # taxonomía sembrada en los proyectos consumidores
├── bin/
│   └── init-project.sh
├── docs/                     # documentación propia del plugin
│   ├── en/                   # inglés (roles, install, usage, contributing)
│   └── es/                   # español
├── LICENSE
└── README.md                 # selector de idioma
```

## Actualizar el plugin

Los roles y las plantillas evolucionan. Para propagar cambios a los consumidores:

1. Edita el archivo relevante en `agents/`, `commands/` o `templates/`.
2. Sube la `version` en `.claude-plugin/plugin.json`.
3. Commit y push.
4. Los consumidores ejecutan `/plugin update crew@factory-crew`. (Las instalaciones autor/local consumen el working tree directamente — basta con hacer pull.)

Para cambios en plantillas, los proyectos existentes deben re-ejecutar `bin/init-project.sh` (que salta los archivos ya existentes) o fusionar la nueva plantilla a mano.

## Mantenimiento

- **Añadir un rol nuevo**: deja un nuevo `agents/<name>.md` (con frontmatter), un nuevo `commands/<alias>.md`, y añade una fila al **área** correspondiente en la tabla de alias de `templates/AGENTS.md` — luego lístalo bajo esa misma área en [`roles.md`](roles.md) (y en su contraparte inglesa `../en/roles.md`). La tabla de alias agrupada en `templates/AGENTS.md` es la fuente de verdad para la asignación de área; el catálogo `roles.md` es su índice. Mantén el conteo de roles consistente entre la tabla de flujo del README, ambos `roles.md` y el árbol de carpetas de arriba.
- **Renombrar un rol**: no lo hagas. Los alias son un vocabulario compartido; renombrar rompe todos los proyectos aguas abajo.
- **Regla específica de stack**: añádela a `templates/.cursor/rules-stack-examples/`, nunca al conjunto universal `.cursor/rules/`.
- **Editar la documentación**: cada doc humano es bilingüe — actualiza `docs/en/` y `docs/es/` en el mismo cambio, y `templates/docs/guides/delivery-circuit.md` tiene un gemelo en español `delivery-circuit.es.md` que debe moverse con él. Los archivos de rol, el resto de `templates/` y el baseline de sesión quedan en inglés (la capa canónica para la máquina).
