# Contribuir y mantenimiento

La [guía de compatibilidad](compatibility.md) explica la base compartida y las
pruebas para Claude/Codex. Edita roles y comandos canónicos y ejecuta
`node scripts/sync-codex.js`; CI detecta las entradas generadas desactualizadas.

## Estructura de carpetas

```
crew-plugin/
├── .claude-plugin/
│   ├── plugin.json
│   └── marketplace.json
├── .codex-plugin/plugin.json # manifiesto Codex, derivado del de Claude
├── agents/
│   ├── product-strategist.md
│   ├── functional-analyst.md
│   ├── system-architect.md
│   ├── ...                   # un archivo por rol
├── commands/
│   ├── prod.md
│   ├── fa.md
│   ├── sys.md
│   ├── ...                   # un archivo por alias
├── skills/                   # 34 entradas de alias generadas + 3 oficios que cualquier rol carga
│   ├── planning/SKILL.md     # planes y estimaciones como work items, en el estándar efectivo
│   ├── writing/SKILL.md      # cómo comunica una pieza
│   └── design/SKILL.md       # cómo formar, entregar, revisar y juzgar una interfaz
├── hooks/
│   ├── hooks.json            # registra los hooks del plugin
│   ├── session-start.js      # SessionStart: baseline, estado de configuración y trabajo en curso
│   ├── guard-immutable.js    # PreToolUse: deniega ediciones a artefactos inmutables
│   ├── guard-estimation.js   # PreToolUse: tablas de estimación y verificación completas antes de cerrar
│   ├── guard-timestamps.js   # PreToolUse: celdas Started/Finished en tiempo real (métricas)
│   ├── guard-code-quality.js # PreToolUse: techos de calidad de código (advise/enforce)
│   ├── guard-shape.js        # PreToolUse: forma del work item contra su estándar efectivo
│   ├── guard-shell.js        # PreToolUse: evasión de hooks y comandos destructivos
│   ├── guard-policy.js       # PreToolUse: relajaciones de crew.json y de los settings del host
│   ├── nudge-offrepo-plan.js # PreToolUse: aviso de planes publicados fuera del repo
│   ├── nudge-scope.js        # PostToolUse: aviso cuando el cambio supera su tamaño
│   ├── record-usage.js       # uso del catálogo, opcional por persona
│   ├── precompact-reminder.js # PreCompact: hitos abiertos antes de compactar
│   ├── codex-pre-tool.js     # adaptador de apply_patch para Codex
│   ├── check-work-log.js     # Stop: chequeo de cierre de sesión
│   └── lib/config.js         # EL intérprete autorizado de crew.json (invariantes de evolución)
├── integrations/codex/README.md  # adaptador de transporte para Codex
├── migrations.json           # qué versiones exigen acción (alimenta el aviso de arranque)
├── standards/
│   ├── session-context.md    # baseline de sesión siempre activo (defaults sugeridos)
│   └── configuration-interview.md  # el set fijo de preguntas que sigue /crew:setup
├── evals/                    # sets de corrida humana: design, planning, security, review, brownfield, routing
│   └── design/               # fixtures + rúbrica: puntúan conducta del agente, nunca gusto
├── templates/
│   ├── AGENTS.md             # contexto canónico de agentes (precedencia, mapa de propiedad, interop)
│   ├── CLAUDE.md             # puntero fino @AGENTS.md
│   ├── standards/
│   │   └── code-quality.md   # núcleo universal (sugerido; las reglas del proyecto ganan)
│   └── docs/                 # taxonomía sembrada en los proyectos consumidores (incl. design/)
├── scripts/
│   ├── init-project.js       # scaffold + crew.json + registro de instalación (init-project.sh lo envuelve)
│   ├── doctor.js             # /crew:doctor — diagnóstico, reparar, desinstalar
│   ├── conformance.js        # estándar efectivo de work items y --check
│   ├── verify.js             # /crew:check — comandos de test declarados, recibos
│   ├── check-supply-chain.js # caracteres ocultos y rutas personales en lo que se distribuye
│   ├── metrics.js            # reporte de /crew:metrics (catalog-usage.js para `catalog`)
│   ├── sec-scan.js           # escaneo de seguridad de la configuración del agente
│   ├── sync-codex.js         # genera las skills de alias para Codex
│   ├── build-release.py      # archivos de release y catálogo Codex
│   ├── check-quality.sh      # puerta de calidad pre-commit (instalada por init)
│   └── check-staged.js
├── docs/                     # documentación propia del plugin
│   ├── en/                   # sub-docs en inglés (roles, install, usage, contributing)
│   └── es/                   # español (README completo + sub-docs)
├── LICENSE
└── README.md                 # README canónico en inglés (ES → docs/es/README.md)
```

## Actualizar el plugin

Los roles y las plantillas evolucionan. Para propagar cambios a los consumidores:

1. Edita el archivo relevante en `agents/`, `commands/`, `skills/` o `templates/`.
2. Sube la `version` en `.claude-plugin/plugin.json` **y** en `.claude-plugin/marketplace.json` — tienen que coincidir.
3. Agrega la entrada de changelog.
4. Agrega una fila en `migrations.json` **si y solo si** la versión exige que el consumidor actúe. Todo lo aditivo u opt-in va con `required: false` y no debe avisar — un aviso de arranque que salta por cosas que nadie tiene que hacer es un aviso que nadie lee.
5. Regenera con `node scripts/sync-codex.js`, ejecuta
   `node scripts/check-supply-chain.js`, `node --test tests/*.test.js`
   y `python tests/release-test.py`,
   y valida ambos manifiestos. Si cambia la integración con el host, ejecuta
   el [smoke aislado de runtime](compatibility.md#pruebas-y-mantenimiento).
6. Commit y push; espera el CI Windows/Linux. Etiqueta ese commit como `vX.Y.Z`.
   Genera con `python scripts/build-release.py --output work/release-X.Y.Z`
   y adjunta todos los archivos de `assets/` a la release GitHub del tag.
   El generador comprueba versiones Claude/Codex/catálogo y rechaza destinos
   existentes. El `.plugin` de Claude y el `.zip` tienen los mismos bytes ZIP;
   el ZIP Codex contiene un catálogo local y una copia generada del plugin.
   `SHA256SUMS` identifica los bytes publicados. No son fuentes independientes.
7. Los consumidores ejecutan `/plugin update crew@factory-crew` en Claude o
   siguen la [actualización Codex](compatibility.md#verificar-y-actualizar).
   Las instalaciones autor/local consumen el working tree: pull y regeneración
   antes de abrir una sesión nueva.

Para cambios en plantillas, los proyectos existentes deben re-ejecutar `scripts/init-project.sh` (que salta los archivos ya existentes) o fusionar la nueva plantilla a mano.

### Cambiar el contrato de `crew.json`

`hooks/lib/config.js` es el **único intérprete autorizado** — para los guards y para los roles por igual. Su header lleva las invariantes de evolución y son vinculantes: una clave existente nunca cambia de significado · los campos nuevos son opcionales y ningún default puede conceder una capacidad · durante una migración se aceptan ambas formas por una versión menor, y retirar la vieja es entrada obligatoria de changelog · no hay versión por sección · **ningún campo puede ser honrado por un rol si `normalize()` no lo transporta**.

Dos consecuencias. Un rol leyendo `crew.json` directamente crearía una segunda interpretación del mismo contrato — ese es exactamente el drift que la invariante existe para impedir. Y el intérprete, la [referencia de configuración](configuration.md) y `migrations.json` se mueven en el **mismo cambio**, nunca en uno posterior: el chequeo mecánico más barato que cerraría esto de forma definitiva es verificar que cada capacidad que el intérprete conoce aparece en la documentación.

## Mantenimiento

- **Añadir un rol nuevo**: deja un nuevo `agents/<name>.md` (con frontmatter), un nuevo `commands/<alias>.md`, y añade una fila al **área** correspondiente en la tabla de alias de `templates/AGENTS.md` — luego lístalo bajo esa misma área en [`roles.md`](roles.md) (y en su contraparte inglesa `../en/roles.md`). La tabla de alias agrupada en `templates/AGENTS.md` es la fuente de verdad para la asignación de área; el catálogo `roles.md` es su índice. El nombre y el alias deben seguir las [reglas de nombres y alias](#reglas-de-nombres-y-alias) de abajo. Su modelo sale de la regla de `agents/crew.md` (decisiones en `opus`, lectura y estructuración en `sonnet`); si cambia, se actualiza esa lista. `tests/catalog.test.js` falla hasta que todas las superficies estén registradas: un test de catálogo en rojo significa que el rol todavía no está agregado.
- **Añadir una skill**: un oficio que necesitan todos los roles es una skill: se carga dentro del trabajo de un rol y es dueña de un *cómo*; las decisiones siguen siendo de los roles. Deja `skills/<name>/SKILL.md` con una `description` lo bastante precisa como para dispararse ante el trigger real (esa descripción *es* el mecanismo de activación), y regístrala en el bloque de skills de `templates/AGENTS.md` y en ambos `roles.md`. Una skill lleva solo método: un valor, paleta, escala, nombre de estilo o librería horneado en una skill es el plugin decidiendo por todos los proyectos consumidores.
- **Renombrar o retirar un rol**: una decisión de catálogo que pasa por el meta-rol `CREW`, nunca una edición casual. Los alias son un vocabulario compartido; todo cambio de alias sale con un redirect de una versión (ver abajo).
- **Regla específica de stack**: mantenla en el `standards/` o el `AGENTS.md` del proyecto consumidor, nunca en el núcleo universal `templates/standards/code-quality.md`.
- **Editar la documentación**: cada doc humano es bilingüe, con el español como fuente de verdad y el inglés como espejo (ver [idioma canónico](#idioma-canónico) abajo); `templates/docs/guides/delivery-circuit.md` tiene un gemelo en español `delivery-circuit.es.md` que debe moverse con él. Los archivos de rol, el resto de `templates/` y el baseline de sesión quedan en inglés (la capa canónica para la máquina).

## Reglas de nombres y alias

El catálogo de roles — nombres, alias, fusiones, retiros — está bajo custodia del meta-rol `CREW`; todo cambio de catálogo pasa por él.

- **Nombre = función, siempre.** Un rol se nombra por lo que hace (`system-architect`, `qa-test-architect`). Cero nombres en clave.
- **Forma del alias**: 2–5 letras mayúsculas, único en todo el catálogo. Ningún alias puede ser prefijo de otro, y se evitan pares a distancia de edición 1 dentro de la misma área. `DA`/`DEA` es una excepción deliberada, aceptada a conciencia: ambos estaban establecidos, y `DEA` se ganó su lugar con evidencia de casos.
- **Todo cambio de alias sale con redirect.** Un alias renombrado o retirado sigue redirigiendo a su sucesor durante una versión, y luego desaparece.

## Idioma canónico

Una decisión editorial, guiada por la audiencia real de `docs/`: **el español es la fuente de verdad**, el inglés es el espejo — actualizado en el mismo PR, nunca después. La paridad estructural entre los árboles `docs/en/` y `docs/es/` (mismos archivos, mismo esqueleto de secciones) la verifica el meta-rol `CREW`. `tests/release-test.py` comprueba de forma mecánica que ambos árboles tengan los mismos archivos y que `compatibility.md` y `contributing.md` tengan los mismos encabezados.
