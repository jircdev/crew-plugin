# Usar crew

Cómo invocar los roles, hacer scaffolding de un proyecto nuevo, onboarding de uno existente y personalizar los docs instalados. Para el proceso de punta a punta que siguen los roles, ver el [circuito de entrega](../../templates/docs/guides/delivery-circuit.es.md).

## Configurar un proyecto nuevo

Con el plugin instalado, solo pídele a la crew que lo configure — sin script, sin terminal:

```
configura la estructura de la crew en este proyecto
```

El rol `crew-installer` instala `AGENTS.md`, `CLAUDE.md`, el baseline de `standards/` y la taxonomía completa de `docs/` (stories, requirements, decisions, briefs, proposals, guides, work, DEVIATIONS). Los archivos existentes se conservan, nunca se sobrescriben.

Luego:

1. Rellena `AGENTS.md` — `{PROJECT_NAME}`, la tabla de stack, el layout de carpetas y los comandos.
2. Escribe `docs/spec.md` con la especificación técnica del proyecto.
3. Ajusta `standards/code-quality.md` si las reglas de tu proyecto difieren del baseline.

## Onboarding de un proyecto existente

**No** hagas scaffolding sobre un proyecto que ya tiene docs y convenciones. El punto de entrada es la auditoría:

```
/crew:doc audita los docs de este proyecto contra el estándar crew
```

El documentation-steward inventaría el proyecto contra la taxonomía del plugin, reporta hallazgos alineado/desviado/faltante, y tú decides por hallazgo: converger (se vuelve una story/requirement) o conservar la desviación. Las desviaciones conservadas se registran en `docs/DEVIATIONS.md` y la resolución de precedencia se escribe en el `AGENTS.md` raíz del proyecto — vinculante para todos los agentes, nunca re-litigada por sesión. El baseline del plugin es sugerido; las reglas propias del proyecto siempre ganan.

## Personalizar los docs instalados

Todo lo que el instalador copia deja de pertenecer al plugin en el momento en que aterriza: el `AGENTS.md`, `standards/` y el árbol `docs/` instalados son **archivos de tu proyecto**. El instalador nunca sobrescribe un archivo existente, así que lo que cambies persiste — pero no todo en esos archivos pesa igual. Hay dos tipos de contenido, y el procedimiento difiere.

### Superficie del proyecto — edítala libremente

Defaults que el scaffold trae para que tengas de dónde partir. Cambiarlos es mantenimiento normal del proyecto: editas tu copia, sin auditoría, sin registro de desviación.

- **Placeholders y datos del proyecto** — `{PROJECT_NAME}`, la tabla de stack, el layout de carpetas y los comandos en `AGENTS.md`.
- **Herramientas nombradas por defecto en las plantillas.** Ejemplo: la plantilla de stories nombra **Playwright** como la herramienta end-to-end en la que `QA` formaliza los test scenarios. Si tu proyecto usa otra, edita tu `docs/stories/README.md` — es tu copia, y editarla es la vía sancionada — y mantén sincronizado `AGENTS.md § Stack`. Según `docs/MAINTAINING.md`, un cambio de herramienta con trade-offs reales lleva además un ADR.
- **Agregados propios del proyecto** — secciones extra en la plantilla de story (p. ej. un bloque "Rollout" o "Eventos de analítica"), filas extra en tablas de ruteo, guías extra. Agrégalas en tu copia; cada story nueva las hereda.
- **Redacción, ejemplos e idioma** de la prosa.

### El estándar estructural — cambiarlo es una desviación

Estos elementos son estructurales: los roles, los hooks y el circuito de entrega los asumen. Divergir está permitido, pero es una **decisión** registrada, nunca una edición silenciosa:

- Carpeta = naturaleza, estado = campo; los archivos nunca se mueven; el kind vive en el slug.
- El ciclo de vida de story/requirement (`Draft → … → Closed`) y el campo `Status:` en el encabezado.
- La puerta de Ready: criterios completos y sin ambigüedad, sin preguntas abiertas, y **al menos un Test scenario**.
- La tabla de estimación, rellenada antes de implementar y completa al cierre. Esta la hace cumplir un hook: exige el encabezado exacto `## Estimation` y las primeras cinco columnas (Milestone a Actual hours) llenas — renombrar la sección o dejar celdas vacías bloquea el cierre.
- La inmutabilidad de los work items Closed y de las entradas de `work/`.
- Fuente única de verdad: un tracker externo guarda solo estado + link; el archivo gana.

Para divergir de cualquiera de estos, corre la conversación de auditoría (`/crew:doc audita los docs de este proyecto contra el estándar crew`). El dueño decide, la desviación queda como fila en `docs/DEVIATIONS.md` con razón y fecha, y desde ahí es vinculante — los agentes la respetan y no la vuelven a señalar.

**Prueba rápida:** ¿el cambio reemplaza la herramienta o la redacción con la que corre el estándar, o cambia la forma del estándar? Herramienta/redacción → edita tu copia. Forma (ciclo de vida, puertas, taxonomía, secciones obligatorias) → fila en `DEVIATIONS.md` vía auditoría `DOC`.

### Qué pasa cuando el plugin se actualiza

Las actualizaciones nunca tocan tus archivos instalados — el bootstrap salta todo lo que ya existe — así que las personalizaciones sobreviven cada actualización. La contracara: las mejoras a las plantillas del plugin **no** llegan solas a tus copias. Para tomarlas, re-corre la auditoría `DOC` después de actualizar: compara tus docs contra el nuevo baseline, respeta cada fila ya registrada en `DEVIATIONS.md`, y tú converges o conservas por hallazgo. No hay merge automático; la conversación de auditoría (o fusionar a mano la plantilla que te interese) es la vía de reconciliación.

## Invocar un rol

Hay **dos formas** de poner un rol a trabajar. Ambas terminan igual —responde un especialista en vez de un generalista— pero difieren en la configuración y en cómo se leen.

### 1. Slash command — `/crew:<alias>` (funciona de una)

Escribe el slash command y el rol toma ese mensaje:

```
/crew:sys ¿cómo separo el módulo de pagos del resto?
/crew:ux organiza la pantalla de inicio para alguien que abre la app por primera vez
```

No hay que configurar nada: en cuanto el plugin está instalado, los 25 comandos existen en **todos** los proyectos. Es la forma más simple y la primera a la que recurrir.

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
