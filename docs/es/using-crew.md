# Usar crew

Cómo invocar los roles, hacer scaffolding de un proyecto nuevo y onboarding de uno existente. Para el proceso de punta a punta que siguen los roles, ver el [circuito de entrega](../../templates/docs/guides/delivery-circuit.es.md).

## Bootstrap de un proyecto nuevo

Desde la raíz del proyecto nuevo (vacío):

```bash
bash C:/w/crew-plugin/bin/init-project.sh
```

Esto deja `AGENTS.md`, `CLAUDE.md`, el baseline de `.cursor/rules/` y la taxonomía completa de `docs/` (stories, requirements, decisions, proposals, guides, work, DEVIATIONS). Los archivos existentes se preservan (se saltan, no se sobrescriben).

Luego:

1. Edita `AGENTS.md` — rellena `{PROJECT_NAME}`, la tabla de stack, el layout de carpetas y los comandos.
2. Escribe `docs/spec.md` con la especificación técnica del proyecto.
3. Elige reglas específicas del stack en `templates/.cursor/rules-stack-examples/` (Tauri+React, Rust, Node sidecar) y copia las relevantes a `.cursor/rules/`.
4. [Instala el plugin](installation.md) para que `/crew:sys`, `/crew:ux`, etc. estén disponibles.

## Onboarding de un proyecto existente

**No** hagas scaffolding sobre un proyecto que ya tiene docs y convenciones. El punto de entrada es la auditoría:

```
/crew:doc audita los docs de este proyecto contra el estándar crew
```

El documentation-steward inventaría el proyecto contra la taxonomía del plugin, reporta hallazgos alineado/desviado/faltante, y tú decides por hallazgo: converger (se vuelve una story/requirement) o conservar la desviación. Las desviaciones conservadas se registran en `docs/DEVIATIONS.md` y la resolución de precedencia se escribe en el `AGENTS.md` raíz del proyecto — vinculante para todos los agentes, nunca re-litigada por sesión. El baseline del plugin es sugerido; las reglas propias del proyecto siempre ganan.

## Invocar un rol

### Slash command

```
/crew:sys añade un comando IPC para lanzar un proceso con variables de entorno personalizadas
```

Lanza el subagente `system-architect`. Lee su doc de rol, se restringe a la autoridad del rol y devuelve el entregable canónico (en este caso: una especificación de arquitectura).

### Prefijo de alias (interpretado por AGENTS.md)

```
SYS: añade un comando IPC para lanzar un proceso con variables de entorno personalizadas
UX: rediseña el panel de procesos para la vista "All"
LEA: dónde está implementada la detección de workspace
```

El `AGENTS.md` del proyecto instruye al agente principal a honrar el prefijo y, o bien lanzar el subagente, o bien leer el doc de rol y adoptar sus restricciones.

## Reglas de composición

De `agents/` (cada doc de rol):

- Un dueño por decisión.
- Especificaciones antes que código. Los roles pueden buscar y editar código, pero implementan solo después de que la dirección converja o el usuario lo pida explícitamente — nunca como primera respuesta. `researcher` es la excepción: estrictamente de solo lectura.
- `security-compliance` puede interrumpir a cualquier rol.
- `researcher` devuelve hallazgos, nunca recomendaciones.
- Los roles conocen el catálogo completo. La sección "Role relationships" de cada doc de rol lista los handoffs y consultas **típicos**; cualquier rol puede invocar a otro cuando la situación lo amerite.
- **Consultar, no diferir.** Cuando una respuesta completa necesita el juicio de otro rol, el agente lo obtiene ahora (spawn o adopción de lente) y responde en el mismo turno — nunca cierra con "revisa esto con ROL".
- **Política de encadenamiento.** Tras un entregable, el siguiente rol encadena en la misma sesión solo si su dueño humano (según el `AGENTS.md` del proyecto § Mapa de propiedad de roles) es el usuario de la sesión; si no, el trabajo se detiene en el artefacto y espera la aprobación de ese humano.
- **Disciplina de estimación.** Cada story/requirement embebe una tabla de estimación por hito (horas estimadas vs. reales), rellenada antes de implementar — así los equipos miden el costo de cada iteración agéntica.
