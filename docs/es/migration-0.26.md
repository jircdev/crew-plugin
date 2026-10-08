# Migración a 0.26 — los work items mantienen su estándar en cada escritura

Aditiva. **No requiere ninguna acción**; leela para saber qué cambia en lo que ve un agente.

## Qué cambió, en un párrafo

Hasta la 0.25 la forma de una story o un requirement se revisaba solo al cerrarlo, y un plan escrito fuera de un archivo (un doc publicado, un artifact, una respuesta en el chat) quedaba fuera de la vista de todos los guards. La 0.26 resuelve el **estándar efectivo** de cada work item (primero la plantilla propia del proyecto, la de crew donde el proyecto no tiene una, y encima las desviaciones declaradas) y se lo exige en cada escritura. Una skill `planning` hace que cualquier plan o estimación termine primero como work items en el repo, cada rol aplica el estándar por encima de un formato que le dicte un orquestador, y los planes publicados por conectores MCP o artifacts que no nombran sus work items reciben un aviso.

## Qué podés notar

| Situación | 0.25 | 0.26 |
|---|---|---|
| Un requirement con columnas de estimación no estándar, `team` + `quality: enforce` | permitido hasta el cierre | **negado al escribir**, nombrando el hueco |
| Lo mismo con `advise`, `solo` o sin `crew.json` | permitido | permitido, con aviso |
| Editar un item viejo que ya se apartaba de la plantilla | permitido | permitido: solo se juzga lo que agrega la edición |
| Un plan publicado en un conector de documentos con tabla de horas y sin ruta del repo | invisible | aviso |

## Si tu proyecto se aparta a propósito de la plantilla de crew

Lo preferible es editar tu propia plantilla en `docs/requirements/README.md` o `docs/stories/README.md`: es tu estándar, y el guard la lee. Cuando el desvío no se puede expresar ahí, se declara con su justificación en `docs/DEVIATIONS.md`:

```markdown
<!-- crew:standard
requirement omit section Verification   # se verifica en el checklist de release
-->
```

`node /ruta/a/crew/scripts/conformance.js <ruta-del-work-item>` imprime el estándar que va a aplicar el guard; `--check <archivos>` informa la conformidad.

## Qué no hace falta hacer

- Nada cambia en `crew.json`. `quality` ya decide entre negar y avisar.
- Los items existentes no se revalidan en forma retroactiva.
- Volver a correr `scripts/init-project.sh` es opcional: solo agrega el bloque vacío `crew:standard` a un `DEVIATIONS.md` recién generado.
