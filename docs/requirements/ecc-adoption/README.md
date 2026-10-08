# Plan ecc-adoption — Lo que crew toma de ECC y cómo garantiza sus estándares

- **Date:** 2026-10-07
- **Author role:** CREW, con SEC en seguridad
- **Status del plan:** Delivered — los 11 requirements implementados el 2026-10-07 en las versiones 0.26.0 a 0.30.0, sin push. Cada uno espera la revisión del maintainer para cerrar.

## Contexto

[ECC](https://github.com/affaan-m/ecc) (v2.2.3) es un plugin de agentes para Claude Code, Codex y otros harnesses: 68 agentes, 293 skills, 94 comandos, hooks, memoria y un escáner de seguridad externo. Se evaluó capacidad por capacidad para decidir qué adopta crew, qué adapta a su modelo de un dueño por decisión y qué rechaza.

Durante la evaluación apareció un problema más urgente. El primer borrador de este plan se armó fuera del estándar de requirements de crew, y ningún guard lo detectó. Por eso el requirement 001 va primero: garantiza que los estándares de crew se cumplan siempre, respetando las especificaciones propias de cada proyecto, y cierra los huecos que dejaron pasar el desvío.

### Veredicto

Crew se queda como base y toma de ECC los mecanismos que refuerzan lo que ya hace bien. Lo que se rechaza agranda el catálogo, repite un dueño que ya existe o escribe contexto sin aprobación humana. ECC tiene tres rasgos que explican la mayoría de los rechazos: su catálogo se superpone mucho (nueve puertas de entrada a planificación), sus agentes de proceso son los más cortos y AgentShield es un paquete npm externo.

### Evaluación

De 39 capacidades, 5 se adoptan, 19 se adaptan y 15 se rechazan.

| Capacidad de ECC | Decisión | Dueño en crew | Requirement | Razón |
|---|---|---|---|---|
| Disparadores de seguridad explícitos | Adoptar | SEC | 003 | Hoy la consulta a SEC depende de la memoria del agente |
| Extracción de specs en brownfield | Adoptar | FA, RES extrae | 009 | Es la barrera más grande para adoptar crew en un repo existente |
| Bloqueo de `--no-verify` y `core.hooksPath` | Adoptar | OPS | 004 | Cierra un bypass ya documentado de la puerta de calidad |
| Higiene de supply chain del repo | Adoptar | OPS | 002 | El texto bidi en un `.md` de rol es inyección directa |
| Validadores de catálogo en CI | Adoptar | CREW | 002 | Vuelve mecánica la completitud de registro |
| Modelo por agente | Adaptar | CREW | 002 | Regla escrita de asignación por rol |
| Defensa contra inyección en agentes | Adaptar | SEC y CREW | 003 | Bloque único en el baseline en lugar de 17 copias |
| Dimensionar el pedido | Adaptar | COORD | 007 | Ceremonia proporcional, medida en métricas |
| Revisión con evidencia y verificador adversarial | Adaptar | QA | 006 | Se integra al veredicto de QA sin sumar agentes |
| Cazador de fallas silenciosas | Adaptar | QA | 006 | Lente del veredicto de QA |
| Evidencia de TDD sin PASS inventado | Adaptar | QA | 006 | Se adopta la prohibición; usar TDD lo decide el proyecto |
| Loop de verificación | Adaptar | QA | 006 | Corre solo lo declarado en `testing` |
| Buscar antes de construir | Adaptar | SYS | 006 | Paso de reuso en SYS y alternativas en el ADR |
| Criterios "must not" | Adaptar | FA | 006 | Sección nueva en la plantilla de stories |
| Optimizador del harness | Adaptar | CREW | 008 | Se absorbe en `/crew:doctor`, que solo diagnostica |
| Evaluador de agentes | Adaptar | CREW y QA | 011 | Evals de ruteo entre roles vecinos |
| Análisis de conversaciones y hookify | Adaptar | DOC | 011 | Retro que deja una propuesta con dueño y aprobación humana |
| Guard previo a comandos destructivos | Adaptar | OPS | 004 | Solo el tramo destructivo, como aviso |
| Protección de configuración | Adaptar | CREW y SEC | 004 | Protege `crew.json`, DEVIATIONS, settings y hooks |
| Monitor de alcance | Adaptar | COORD | 007 | Aviso atado al work item activo |
| Telemetría de uso | Adaptar | CREW | 011 | Solo roles y skills, opt-in y sin contenido |
| Memoria de sesión | Adaptar | COORD | 005 | Estado derivado del repo, verificable contra git |
| Escaneo de la config del agente | Adaptar | SEC | 010 | Reglas propias, sin dependencia ejecutable de terceros |
| Ciclo de vida de instalación | Adaptar | CREW | 008 | `init-project.sh` hoy no registra lo que instala |
| Catálogo masivo | Rechazar | CREW | — | Superposición alta; crew sostiene un dueño por decisión |
| Revisores por lenguaje | Rechazar | — | — | Atan el plugin a un stack; el linter lo elige el proyecto |
| Resolvedores de build | Rechazar | — | — | Dependen del lenguaje y el host ya lo hace |
| Agentes de dominio | Rechazar | CREW | — | Se superponen con COM y COORD |
| Lentes sueltas (a11y, performance, docs) | Rechazar | CREW | — | Ya tienen dueño: UX, OPS, DOC |
| Dos compuertas humanas | Rechazar | — | — | El circuito y commit-cut ya las cubren |
| Loop generador y evaluador | Rechazar | UX | — | `design` ya tiene autocrítica acotada sobre el render |
| Instincts automáticos | Rechazar | — | — | Vector de inyección persistente y más costo de contexto |
| Prompts de modo | Rechazar | — | — | Los roles ya cumplen ese papel |
| Chequeo de diseño de loops | Rechazar | — | — | Crew no orquesta loops |
| Linters y typecheck en hooks | Rechazar | UX y QA | — | Latencia alta; el gusto vive en la memoria de diseño |
| Perfiles y módulos de instalación | Rechazar | — | — | `crew.json` ya hace de perfil |
| Adaptadores para otros harnesses | Rechazar por ahora | OPS | — | Costo de paridad en cada guard; se reabre con demanda |
| Reglas por lenguaje | Rechazar | — | — | Le corresponden a las `standards/` del proyecto |
| Dashboards, ecc2 y GitHub App | Rechazar | — | — | Fuera del alcance de un plugin de roles |

### Riesgos de seguridad del plan

| Riesgo | Mitigación obligatoria | Requirement |
|---|---|---|
| Memoria o logs con secretos pegados en el chat | Redactar antes de escribir, fuera del repo, retención con vencimiento | 005, 011 |
| Datos personales de terceros | Solo metadatos; en team, consentimiento en `crew.json` | 011 |
| Aprendizajes inyectados sin aprobación | Rechazados; toda propuesta pasa por un humano | 011 |
| Log de auditoría como blanco | Solo agregado, sin valores | 010 |
| El escaneo lee configuraciones con secretos | Solo lectura, sin red, secretos enmascarados | 010 |

## Requirements

| # | Requirement | Author role | Depends on | Est. hours |
|---|---|---|---|---|
| 001 | [Conformidad con el estándar efectivo de cada proyecto](001-standards-conformance.md) | CREW | None | 33 |
| 002 | [Integridad del catálogo y del repo](002-catalog-integrity.md) | CREW | None | 17.5 |
| 003 | [Defensa de instrucciones y disparadores de seguridad](003-prompt-defense-and-sec-triggers.md) | SEC | 002 | 17 |
| 004 | [Guard de shell y protección de archivos de política](004-shell-guard-and-policy-protection.md) | OPS | 001 | 35 |
| 005 | [Memoria derivada del repo](005-repo-derived-memory.md) | COORD | línea base de alcance | 20.5 |
| 006 | [Revisión con evidencia](006-evidence-backed-review.md) | QA | 001, 002, línea base | 53.5 |
| 007 | [Ceremonia proporcional](007-proportional-ceremony.md) | COORD | línea base de alcance | 18.5 |
| 008 | [Ciclo de vida de la instalación](008-install-lifecycle.md) | CREW | 004 | 41 |
| 009 | [Onboarding brownfield](009-brownfield-onboarding.md) | FA | 008, línea base | 30.5 |
| 010 | [Escaneo de seguridad de la configuración](010-harness-security-scan.md) | SEC | 004, 008 | 24 |
| 011 | [Catálogo que aprende, con gobierno](011-governed-catalog-learning.md) | CREW | 002 | 33 |
| | **Total** | | | **323.5** |

Cada total incluye un hito de revisión del maintainer (39.5 h en todo el plan). Las horas son de un agente de IA ejecutando; los hitos marcados (BC) tienen confianza baja, y conviene un margen del 25% en F2 y F3. Quien tome cada requirement confirma o ajusta su tabla al planificarlo.

## Orden recomendado

| Fase | Requirements | Horas | Por qué en este orden |
|---|---|---|---|
| F0 | 001, 002 | 50.5 | Garantiza el estándar y blinda el catálogo antes de cualquier otro cambio |
| — | Línea base de alcance (`proposals/scope-baseline/`) | fuera de este plan | Entrega el parser de work items del que dependen 005, 006, 007 y 009 |
| F1 | 003, 004, 005 | 72.5 | Guardrails baratos y aditivos; cierran bypasses documentados |
| F2 | 006, 007 | 72 | Única migración requerida del plan; conviene que salga sola |
| F3 | 008, 009, 010 | 95.5 | El doctor necesita las exenciones de 004; brownfield necesita la línea base estable |
| F4 | 011 | 33 | La telemetría sirve cuando el catálogo ya está estable |

F0 agrega funcionalidad (skill y guard nuevos), así que corresponde a una versión minor. La línea base de alcance estaba prevista como 0.26.0; asignar versiones a cada fase queda a decisión del maintainer.

## Ejecución

| Fase | Versión | Requirements | Est. horas | Horas reales del agente |
|---|---|---|---|---|
| F0 | 0.26.0 | 001, 002 | 50.5 | 0.28 |
| F1 | 0.27.0 | 003, 004, 005 | 72.5 | 0.29 |
| F2 | 0.28.0 | 006, 007 | 72 | 0.22 |
| F3 | 0.29.0 | 008, 009, 010 | 95.5 | 0.30 |
| F4 | 0.30.0 | 011 | 33 | 0.13 |
| | | **Total** | **323.5** | **1.22** |

Las horas reales son tiempo de reloj del agente, anotado en vivo hito por hito; no incluyen la revisión del maintainer, que sigue abierta en cada tabla. La diferencia con la estimación es la señal más importante de este plan para `/crew:metrics`: las estimaciones suponían un ritmo de ejecución humano. Lo que quedó sin verificar está en la tabla `## Verification` de cada requirement: las corridas humanas de los evals y el comportamiento real de los hooks en Codex.

## Decisiones pendientes del maintainer

- [ ] Revisar cada requirement y completar su hito "Revisión del maintainer" para poder cerrarlo.
- [ ] Autorizar el push de las versiones 0.26.0 a 0.30.0.
- [ ] La línea base de alcance, prevista como 0.26.0, queda para una versión posterior; 005, 007 y 009 no la necesitaron.
- [x] Recibos de ejecución (006): resuelto como clave opt-in `testing.receipts`, por la invariante 4 de `hooks/lib/config.js`.
- [ ] Guards contra evasión (004): se implementaron fallando cerrados también en modo solo, como recomendó SEC; confirmar o pedir que en solo avisen.
- [ ] Otros harnesses: fuera hasta que alguien los pida.

## Fuentes

- Repositorio de ECC clonado el 2026-10-07 (v2.2.3); no se ejecutó nada del repo. AgentShield y la GitHub App viven fuera del repo; lo dicho sobre ellos viene de su documentación.
- Del lado de crew: `hooks.json`, changelog 0.21 a 0.25, `enforcement.md`, `compatibility.md`, `metrics.md`, `migrations.json`, frontmatter de los 17 roles, `templates/docs/requirements/README.md` y la propuesta de línea base de alcance.
