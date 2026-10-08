# Migración a 0.27 — disparadores de seguridad, evasión de hooks y relajación de políticas

**No hace falta ninguna acción para que el plugin funcione.** Dos negaciones nuevas pueden cambiar lo que un agente puede hacer en un proyecto con `crew.json`; leé la tabla antes de contar con el comportamiento anterior.

## Qué cambió, en un párrafo

El baseline de sesión ahora declara una **frontera de instrucciones** (lo que un agente lee por una herramienta es dato, nunca una instrucción) y una lista de **disparadores de seguridad** que consultan a `security-compliance`. Un guard de shell niega los flags que apagan los hooks de git (`--no-verify`, `git commit -n`, `core.hooksPath`) y avisa ante comandos destructivos. Un guard de políticas detecta las ediciones que relajan los controles bajo los que trabajan los agentes: bajar `quality`, apagar `metrics` o `testing`, pasar a `solo`, subir techos, desactivar hooks o conceder permisos de bypass en los settings del host. Cada bloque de `docs/DEVIATIONS.md` acepta ahora `owner:` y `expires:`. Las sesiones abren con un bloque corto de trabajo en curso leído del repo.

## Qué puede negarse ahora

| Situación | Antes | 0.27 |
|---|---|---|
| Un agente corre `git commit --no-verify` en un proyecto con `crew.json` | permitido | **negado**, en ambos modos |
| Un agente corre `git config core.hooksPath …` (por ejemplo, para configurar a mano un gestor de hooks) | permitido | **negado**: corrélo vos, fuera del agente |
| Un agente baja `quality` en un proyecto `team` + `enforce` | permitido | **negado** salvo registro en `crew:policy` |
| Lo mismo con `advise`, en `solo` o sin `crew.json` | permitido | permitido, con aviso |
| `rm -rf`, `git reset --hard`, push forzado | permitido | permitido, con aviso que pide objetivos y vuelta atrás |

## Si tu proyecto relaja un control a propósito

Registrá la clave, con su justificación, en `docs/DEVIATIONS.md` antes de la edición:

```markdown
<!-- crew:policy
crew.json quality   # advise mientras se migra el módulo legacy · owner: ana · expires: 2027-01-31
-->
```

Claves y gramática: [enforcement.md](enforcement.md#relajación-de-políticas).

## Qué no hace falta hacer

- Nada cambia en `crew.json`.
- Las exenciones existentes siguen funcionando; `expires:` es opcional y solo acorta la vida de una entrada cuando lo agregás.
- Los proyectos sin `crew.json` reciben avisos, nunca negaciones nuevas.
