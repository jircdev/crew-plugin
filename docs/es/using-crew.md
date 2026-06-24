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

Hay **dos formas** de poner un rol a trabajar. Ambas terminan igual —responde un especialista en vez de un generalista— pero difieren en la configuración y en cómo se leen.

### 1. Slash command — `/crew:<alias>` (funciona de una)

Escribe el slash command y el rol toma ese mensaje:

```
/crew:sys ¿cómo separo el módulo de pagos del resto?
/crew:ux organiza la pantalla de inicio para alguien que abre la app por primera vez
```

No hay que configurar nada: en cuanto el plugin está instalado, los 24 comandos existen en **todos** los proyectos. Es la forma más simple y la primera a la que recurrir.

### 2. Prefijo — `ROL:` (se lee como hablarle a una persona)

Empieza el mensaje con el alias del rol y dos puntos:

```
SYS: ¿cómo separo el módulo de pagos del resto?
UX: organiza la pantalla de inicio para alguien que entra por primera vez
```

Se lee más natural que un slash command, pero **no** funciona solo — necesita el *protocolo de activación* en contexto primero. Lo tienes en uno de dos alcances:

- **Por proyecto** — un proyecto montado con la crew lo lleva en su `AGENTS.md`, así que el prefijo funciona dentro de ese proyecto.
- **En todos lados (global)** — se inyecta una vez en tu `~/.claude/CLAUDE.md`, que Claude lee en cada sesión (ver abajo).

### ¿Cuál uso?

| | `/crew:sys …` | `SYS: …` |
|---|---|---|
| Configuración | ninguna — funciona ya instalado | necesita activación (proyecto o global) |
| Dónde funciona | cualquier proyecto | donde esté inyectado el protocolo |
| Se siente como | un comando | lenguaje natural |
| Mejor para | una consulta puntual a un experto | trabajar en modo rol seguido |

Si dudas, usa el slash command. El prefijo es una comodidad para quien vive en modo rol.

### Activar el prefijo en todos lados (global)

Corre el instalador una vez, apuntándolo a tu config global:

```
/crew:inst activa la crew en mi ~/.claude/CLAUDE.md global para que el prefijo "ROL:" funcione en todas las sesiones
```

Escribe el protocolo de activación + la tabla de alias en `~/.claude/CLAUDE.md`. Desde ahí, `SYS:`, `DA:`, `UX:`, … funcionan en cualquier sesión y proyecto. El `AGENTS.md` propio de un proyecto sigue ganando donde haya conflicto.

### ¿Un mensaje, o toda la conversación?

Por defecto el prefijo activa el rol para **ese mensaje**; el siguiente vuelve al generalista. Si quieres que el rol **se quede** toda la conversación (dices `SYS:` una vez y sigues como system-architect hasta que cambies), pídele al instalador la variante pegajosa:

```
/crew:inst … pero pegajoso: un prefijo "ROL:" queda activo toda la conversación hasta que se declare otro "ROL:" distinto
```

Con modo pegajoso, ten una forma de volver al generalista (p. ej. un reset `GEN:`) para no quedar atrapado en un rol.

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
