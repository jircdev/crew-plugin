# Catálogo de roles

16 roles core más 1 perfil extendido, invocados como `/crew:<alias>` (o el prefijo `ALIAS:` donde esté activado). Léelos de dos formas: por **área** (cómo están organizados) y por **etapa de entrega** (cuándo actúa cada uno) — ambas abajo. Tabla de propiedad completa: [`templates/AGENTS.md`](../../templates/AGENTS.md).

## Por área

Cada rol pertenece a exactamente una de seis áreas, que siguen el proceso de punta a punta: descubrimiento, producto, diseño, ingeniería, calidad y gobernanza.

**1. Negocio y Descubrimiento** — entender qué necesita el cliente, juzgar la viabilidad de negocio, redactar el manifiesto que inicia el proyecto.

| Alias | Rol | Qué hace |
|-------|-----|----------|
| `COM` | commercial-strategist | Descubrimiento con el cliente y viabilidad de negocio; redacta el manifiesto del proyecto — la puerta de entrada, aguas arriba de producto. También posee la estrategia de marca y contenido para la web pública: posicionamiento, sitemap, mensaje. |
| `PROD` | product-strategist | Visión de producto, roadmap, jobs-to-be-done, priorización y métricas de éxito — aguas arriba de todo rol de producto. |

**2. Producto y Entrega** — convertir la intención en producto y en trabajo ejecutable: stories, criterios de aceptación, secuenciación del equipo.

| Alias | Rol | Qué hace |
|-------|-----|----------|
| `FA` | functional-analyst | Descompone la intención en stories con criterios de aceptación; valida el trabajo entregado contra ellos. |
| `COORD` | delivery-coordinator | Secuencia roles, expone bloqueos, mantiene la fidelidad de la intención. Coordina; las decisiones técnicas y de producto son de otros roles. |

**3. Diseño y Experiencia** — qué información necesita cada pantalla, cómo se ve y se comporta, y el sistema visual transversal.

| Alias | Rol | Qué hace |
|-------|-----|----------|
| `DEA` | data-experience-architect | Define la especificación informacional por pantalla — qué datos necesita cada vista. |
| `UX` | ux-architect | Layout, interacción, flujo, accesibilidad y el sistema visual transversal (design tokens, tipografía, color, motion, iconografía). Dueño del gusto: composición, densidad, jerarquía, elegancia. Se le consulta **antes** de codificar la UI, y nunca emite un veredicto de calidad de diseño sin ver el render. |

**4. Ingeniería y Arquitectura** — cómo se construye el sistema: arquitectura, datos, frontend, contratos de extensión.

| Alias | Rol | Qué hace |
|-------|-----|----------|
| `SYS` | system-architect | Arquitectura, contratos de API, patrones entre módulos y el contrato de extensión plataforma-base ↔ módulos/productos. |
| `DA` | data-architect | Esquema, integridad, migraciones, rendimiento de consultas. |
| `FE` | frontend-architect | Estado de frontend, fetching de datos, routing, formularios — consulta a `UX` en fase de diseño antes de codificar cualquier interfaz. |

**5. Calidad, Seguridad y Operaciones** — que lo construido sea correcto, seguro, medible y entregable: testing, seguridad, operaciones, analítica.

| Alias | Rol | Qué hace |
|-------|-----|----------|
| `SEC` | security-compliance | Datos personales, RBAC, regulatorio — puede interrumpir a cualquier rol. |
| `QA` | qa-test-architect | Estrategia de testing, fixtures, cobertura de regresión; en modo veredicto, el veredicto post-implementación de código vs. las especificaciones escritas. |
| `OPS` | platform | Todo lo posterior al merge: releases, versionado, orden de publicación, changelog, deploys, CI/CD, infra cloud, SLOs, error budgets, observabilidad en runtime, presupuestos de rendimiento. |
| `ANA` | analytics-architect | Taxonomía de eventos, KPIs, instrumentación, funnels. |

**6. Gobernanza y Meta** — el propio catálogo y la documentación: roles, estándares, docs, exploración de solo lectura.

| Alias | Rol | Qué hace |
|-------|-----|----------|
| `DOC` | documentation-steward | Estructura de docs, ciclo de vida y prevención de drift. |
| `RES` | researcher | Exploración de solo lectura — devuelve hallazgos, nunca recomendaciones. |
| `CREW` | crew | La crew en sí: gobierna el catálogo (añadir/fusionar/retirar roles, resolver solapamientos de autoridad, mantener los docs de rol consistentes) y lo instala/activa en un destino para que el prefijo `ALIAS:` funcione. |

## Perfil extendido (opt-in)

No forma parte de la crew core — actívalo solo cuando el proyecto lo necesita.

| Alias | Rol | Qué hace |
|-------|-----|----------|
| `API` | dx-architect | Experiencia de desarrollador de la API/SDK pública: versionado, deprecación, ergonomía. Actívalo solo cuando el producto expone una API o SDK pública. |

## Skills — oficios

Un oficio que necesitan todos los roles es una **skill**. Una skill se carga dentro del trabajo de un rol, sin invocarse aparte, y es dueña de un *cómo*; las decisiones siguen siendo de los roles.

- **`planning`** — la artesanía del work item, cargada siempre que se planifica o dimensiona trabajo. Resuelve el estándar efectivo del proyecto antes de escribir, mantiene los planes como work items en el repo (un doc publicado es una vista que los enlaza) y gobierna los dos niveles de estimación. Es dueña de la forma, nunca de las decisiones de dominio del plan.
- **`writing`** — la artesanía de la comunicación, cargada cuando un rol redacta una pieza (brief, deck, one-pager, ensayo, doc técnico, discurso, guion). Posee idea-fuerza, arco narrativo, segmentación por público, principios de impacto — nunca el contenido de dominio.
- **`design`** — la artesanía de la interfaz, cargada por todo trabajo que cambie lo que el usuario **ve, entiende, elige o hace**: una pantalla, un estado, una vista vacía, un mensaje de error, el texto de un formulario. Cuatro modos — `shape`, `handoff`, `implementation-review`, `visual-review` — cada uno con su fallback nombrado para lo que el proyecto no declaró. Lleva solo método: qué es bueno *en tu producto* vive en tu `docs/design/`, y qué *puede hacer* tu proyecto (dónde corre, su registro de componentes, cómo se capturan renders) se declara en `crew.json`. Ver [configuration.md](configuration.md#capacidades-de-diseño).

## Por etapa de entrega

La crew sigue un circuito spec-driven alineado con Scrum: un artefacto por etapa, leído del repo, nunca re-pegado en un prompt. Estándar completo: [circuito de entrega](../../templates/docs/guides/delivery-circuit.es.md).

| Etapa | Qué pasa | Artefacto | Roles |
|-------|----------|-----------|-------|
| **1 · Visión** | El *porqué* y el objetivo; go/no-go del sponsor antes de cualquier trabajo de backlog | `docs/briefs/` | `COM` [commercial-strategist](../../agents/commercial-strategist.md)<br>`PROD` [product-strategist](../../agents/product-strategist.md) |
| **2 · Backlog y diseño** | Descompone la intención en stories con criterios de aceptación; define qué necesita cada pantalla y cómo se ve | `docs/stories/` | `FA` [functional-analyst](../../agents/functional-analyst.md)<br>`COORD` [delivery-coordinator](../../agents/delivery-coordinator.md)<br>`DEA` [data-experience-architect](../../agents/data-experience-architect.md)<br>`UX` [ux-architect](../../agents/ux-architect.md)<br>`COM` [commercial-strategist](../../agents/commercial-strategist.md) (estrategia de web pública) |
| **3 · Diseño técnico** | Decisiones de arquitectura just-in-time (no un gran documento por adelantado); el trabajo puramente técnico como carril propio | `decisions/` (ADR) · `spec.md` · `requirements/` | `SYS` [system-architect](../../agents/system-architect.md)<br>`DA` [data-architect](../../agents/data-architect.md)<br>`FE` [frontend-architect](../../agents/frontend-architect.md)<br>`API` [dx-architect](../../agents/dx-architect.md) (extendido, si está activado) |
| **4 · Construir** | Implementa una story/requirement lista; el arquitecto de dominio implementa su propia área | código + PR | (roles de la etapa 3, en modo implementación) |
| **5 · Entregar y verificar** | Probar, validar contra criterios, asegurar, desplegar, publicar, medir | Validación de la story · `work/` | `QA` [qa-test-architect](../../agents/qa-test-architect.md)<br>`SEC` [security-compliance](../../agents/security-compliance.md)<br>`OPS` [platform](../../agents/platform.md)<br>`ANA` [analytics-architect](../../agents/analytics-architect.md) |

El diseño técnico (etapa 3) **no** es un gate obligatorio antes de cada story: las decisiones se toman just-in-time por work item; un spec completo por adelantado solo corresponde a iniciativas puramente técnicas (un `requirement`, en paralelo a las stories), nunca como waterfall. Transversales en toda etapa: `DOC` [documentation-steward](../../agents/documentation-steward.md), `RES` [researcher](../../agents/researcher.md) y `CREW` [crew](../../agents/crew.md).

## Aliases retirados

El catálogo se consolidó en la 0.21 y cada alias retirado tiene un sucesor. Los slash commands antiguos todavía existen: avisan cuál es el sucesor y siguen con la tarea en ese rol. Para migrar un proyecto existente: [migration-0.21.md](migration-0.21.md).

| Alias antiguo | Sucesor | Por qué |
|---------------|---------|---------|
| `PERF` | `OPS` | Rendimiento y confiabilidad se fusionaron en platform — todo lo posterior al merge es OPS. |
| `REL` | `OPS` | El ciclo de vida del release se fusionó en platform. |
| `INFRA` | `OPS` | Infra cloud y CI/CD se fusionaron en platform. |
| `SC` | `QA` | Spec-compliance es ahora el modo veredicto de QA. |
| `WEB` | `COM` | La estrategia de web pública la absorbió commercial-strategist. |
| `VIS` | `UX` | El sistema visual transversal lo absorbió ux-architect. |
| `MOD` | `SYS` | Los contratos de extensión los absorbió system-architect. |
| `CA` | `CREW` | Gobernanza del catálogo e instalación se fusionaron en un solo rol. |
| `INST` | `CREW` | Gobernanza del catálogo e instalación se fusionaron en un solo rol. |
| `DX` | `API` | Renombrado; ahora es un perfil extendido (opt-in). |
| `LEA` | `RES` | Alias renombrado; mismo rol de solo lectura. |
| `COMM` | skill `writing` | La artesanía de la comunicación pasó a ser una skill que cualquier rol carga. |
