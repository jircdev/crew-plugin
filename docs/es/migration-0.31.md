# Migración a 0.31 — modo factory

Aditiva. **No requiere ninguna acción** en proyectos que no usan factory.

## Qué cambió, en un párrafo

Los proyectos que llevan su trabajo y su tiempo en factory pueden declararlo con un bloque `factory` en `crew.json`. En ese modo la especificación sigue en el repo y la actividad (estimación, estado y horas) vive en factory, enlazada con la línea `**Factory activity:**` de la cabecera del work item. Cada persona conecta su máquina con `/crew:factory login`; desde ahí el plugin registra en segundo plano el tiempo de la persona y el del agente, y lo manda a factory para confirmarlo cada semana. `/crew:metrics` lee el backlog de factory. La guía completa está en [factory.md](factory.md).

## Qué podés notar

- En un proyecto con bloque `factory`, el cierre de una story pide la línea `**Factory activity:**` en lugar de la tabla `## Estimation`.
- Sin conectarte con `/crew:factory login`, no se registra nada sobre vos.
- La plantilla de stories suma el campo opcional `**Factory activity:**`.

## Qué no hace falta hacer

- Nada, si el proyecto no declara `factory`.
- Las horas estimadas siguen siendo horas hombre. Las horas del agente se registran como medida aparte; todavía no hay estimación de horas de agente.
