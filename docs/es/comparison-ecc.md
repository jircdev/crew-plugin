# Crew frente a ECC

Comparación entre crew y [ECC](https://github.com/affaan-m/ecc), un plugin de agentes para Claude Code, Codex y otros harnesses. Sirve para decidir qué tomar de ECC y dónde crew ya está mejor.

- **Versiones comparadas:** ECC 2.2.3 (revisado el 2026-10-07), crew 0.25.0 (antes del plan de adopción) y crew 1.0.0 (publicado el 2026-10-08).
- **Fuentes:** el repositorio de ECC leído sin ejecutar nada, y el código y los tests de crew. Lo que se dice de AgentShield y de la GitHub App de ECC viene de su documentación, porque su código no está en el repositorio.

## Resumen

Crew 1.0 cerró la mayoría de las brechas que tenía contra ECC. ECC sigue adelante en amplitud de catálogo, memoria automática entre sesiones, cantidad de harnesses e instalación por perfiles. Crew lidera en gobierno de decisiones, entrega trazable y control de estándares.

## Tabla comparativa

| Dimensión | ECC 2.2.3 | Crew 0.25 | Crew 1.0 | Mejor ahora |
|---|---|---|---|---|
| Foco | Ejecución de código: planificar, testear, revisar | Proceso de equipo, del negocio a la gobernanza | Igual, con más mecanismos | Depende del uso |
| Tamaño del catálogo | 68 agentes, 293 skills, 94 comandos | 17 roles, 2 oficios | 17 roles, 3 oficios, 35 comandos | ECC en cobertura, crew en coherencia |
| Autoridad entre agentes | Especialistas que se superponen | Un dueño por decisión | Igual, y el rol aplica el estándar aunque le dicten otro formato | Crew |
| Cumplimiento de estándares | Reglas por lenguaje; no lee las plantillas del proyecto | Solo al cerrar un item | Valida cada escritura contra la plantilla del proyecto y respeta las desviaciones declaradas | Crew |
| Planes y estimación | Planes en `.claude/plans/`, sin horas | Tabla de estimación al cerrar | Skill de planificación que escribe primero en el repo; ceremonia según el tamaño del pedido; métricas por tamaño | Crew |
| Revisión de código | Revisores por lenguaje y verificador adversarial, sin dueño | Veredicto de QA sin esquema | Hallazgos con severidad, rol dueño y evidencia; verificación adversarial; fallas silenciosas; criterios "Must not" | Crew en método, ECC en especialización por stack |
| Prueba de que un test corrió | Reporte de TDD en prosa | `passing` sin respaldo | Recibos de ejecución con hash; el cierre los exige si el proyecto lo activa | Crew |
| Evasión de controles | Bloquea `--no-verify` y protege las configs de linter | No existía | Bloquea `--no-verify` y `core.hooksPath`, protege `crew.json` y los settings, falla cerrado | Empate |
| Seguridad de la configuración | AgentShield, paquete npm externo | No existía | Escaneo propio, sin red ni dependencias, con informe fechado | Crew por autonomía, ECC por cantidad de reglas (102 declaradas) |
| Defensa contra inyección | Bloque copiado en cada agente | No existía | Bloque único en el baseline y disparadores que obligan a consultar a SEC | Crew |
| Memoria entre sesiones | Resúmenes de transcript e "instincts" automáticos | No existía | Estado leído del repo (hitos abiertos, items pendientes); no lee transcripts | ECC en alcance, crew en confiabilidad y privacidad |
| Aprendizaje del uso | Instincts automáticos que pasan a skills | No existía | Uso del catálogo con consentimiento de cada persona y una retro que deja propuestas para aprobar | ECC en automatización, crew en gobierno |
| Instalación y diagnóstico | CLI con perfiles, `doctor`, `repair`, `uninstall`, `--dry-run` | Scaffold sin registro | Registro de lo instalado, `/crew:doctor`, `repair`, `uninstall`, `--dry-run` | Empate; ECC con perfiles más finos |
| Proyectos existentes | spec-miner | Solo auditoría de docs | `/crew:adopt`: extrae reglas con su commit y avisa cuando quedan viejas | Crew |
| Horas humanas y de agente | No existe | No existía | Captura en factory del tiempo de la persona y del agente; todavía no se estiman horas de agente | Crew |
| Harnesses | Claude y Codex completos; 12 más parciales | Claude y Codex | Claude y Codex, verificados en hosts reales | ECC |
| Verificación contra el host real | Tests unitarios y CI en 3 sistemas operativos | Smoke básico | Smoke fijado a Codex 0.130 con casos reales de shell, MCP y compactación | Crew |
| Costo de contexto | Alto, mitigado con perfiles | Bajo | Bajo; el baseline tiene un tope de 9000 caracteres verificado por test | Crew |
| Documentación | Guías largas en 14 idiomas | Español e inglés | Español e inglés, auditada en lenguaje claro, con guía para configurar la 1.0 | ECC en volumen, crew en claridad |
| Comunidad y madurez | 275k estrellas, releases semanales | Un mantenedor | Un mantenedor, 1.0 publicada | ECC |

## Lo que ECC sigue haciendo mejor

- Revisores y resolvedores de build por lenguaje.
- Memoria automática entre sesiones.
- Más de 14 harnesses.
- Perfiles de instalación por módulo.
- La escala de su comunidad.

## Huecos abiertos en crew

- **Compactación en Codex:** después de compactar no corre ningún SessionStart, así que el bloque de trabajo en curso no vuelve al modelo.
- **Horas de agente:** se capturan, pero todavía no se estiman.
- **Evals:** los cinco sets requieren una corrida humana que todavía no se hizo.

## Qué se descartó de ECC y por qué

El plan de adopción ([docs/requirements/ecc-adoption/](../requirements/ecc-adoption/README.md)) evaluó 39 capacidades: adoptó 5, adaptó 19 y descartó 15. Los descartes más importantes:

- **Catálogo masivo y revisores por lenguaje:** atan el plugin a un stack y rompen la regla de un dueño por decisión.
- **Instincts automáticos:** escriben contexto sin aprobación humana y pueden fijar una instrucción maliciosa en todas las sesiones futuras.
- **Otros harnesses:** cada uno suma costo de paridad en todos los guards. Se reabre cuando alguien lo pida.
