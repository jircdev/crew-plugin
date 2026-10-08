# Migración a 0.23 — verificación y totales

Dos cambios llegan a los repos existentes. Uno puede bloquear un cierre el mismo día que actualices, así que conviene dedicarle dos minutos ahora.

## Qué cambió, en un párrafo

Las tablas de estimación ahora cierran con una fila **Total**, y todo work item declara **cómo se verificó** en una tabla `## Verification` escrita en planning. Lo primero es obligatorio en todos lados donde ya corría la puerta de estimación. Lo segundo solo obliga donde el proyecto declara una sección `testing` en `crew.json` — declararla es lo que convierte la tabla en compuerta.

## 1. La fila Total — obligatoria donde corre la puerta de estimación

| Situación | Qué pasa |
|---|---|
| Modo team, o repo sin `crew.json` | Cerrar una story/requirement ahora exige fila `Total` |
| Solo con `"metrics": true` | Igual |
| Solo sin métricas | No cambia nada |

**La solución, por work item, al cerrar:**

```
| **Total** | 12 | — | — | 15 | |
```

Primera celda `Total` (el énfasis es opcional, no distingue mayúsculas), horas estimadas y reales completas. Las columnas de timestamp quedan vacías o con guion, porque el total suma los hitos y no tiene fechas propias. Los archivos ya Closed no se tocan: la puerta dispara en la transición, y de ahí en adelante manda la inmutabilidad.

Por qué es obligatoria: un número que nadie suma es un número que nadie lee. El total es lo que vuelve comparable un plan con su resultado sin hacer aritmética, y cuesta una línea.

## 2. La tabla de verificación — solo si declarás `testing`

Nada dispara hasta que agregues la sección. Cuando lo hagas:

```json
{
  "testing": {
    "guide": "docs/guides/testing.md",
    "e2e": { "kind": "playwright", "specs": "tests/e2e" },
    "commands": [ { "kind": "e2e", "cmd": "npm run test:e2e" } ]
  }
}
```

Desde ahí, un work item no llega a `Closed` sin:

```
## Verification

| Scenario | Level | Harness | Artifact | Status |
|---|---|---|---|---|
| El manager aprueba una solicitud pendiente | e2e | playwright | tests/e2e/approve.spec.ts | passing |
| Importación masiva de más de 10k filas | none | none | — | no verificado — sin fixture a ese volumen |
```

Vale en **ambos** modos y no depende de `metrics`: la puerta de estimación es la disciplina de métricas, esta es tu propia declaración.

**`no verificado` es una fila válida.** La puerta pide un registro honesto, aunque quede incompleto. Lo que rechaza es el silencio, porque desde afuera una fila ausente y una cubierta se ven idénticas.

## Por qué existe

Un plan que lleva "tests" como un bullet suelto esconde el número más grande de la estimación. El caso que originó este cambio: un frontend sin ninguna infraestructura de test — sin runner, sin specs, sin paso de CI que corra nada — donde el plan decía "tests" y el costo real de dejar el trabajo verificable fue un 50% más sobre la estimación completa, descubierto después de haberla entregado.

La tabla fuerza la pregunta en planning, donde es barata: por cada comportamiento, en qué nivel, con qué arnés, y qué queda descubierto.

## Lo que el plugin sigue sin hacer

Nombrar tu herramienta de test. `e2e.kind` es una etiqueta libre — como se llame tu arnés va ahí, y todos los roles derivan de tu declaración. Un estándar que impusiera una herramienta concreta produciría specs que no corren en todo repo que use otra, y una tabla de verificación que se lee cubierta mientras no se ejecuta nada.

## Nuevo en el scaffold

`scripts/init-project.sh` ahora escribe `docs/guides/testing.md` en **ambos** modos (vacío a propósito: niveles, arnés, barra de adopción y protocolo manual los llenás vos) y siembra `"testing": { "guide": "docs/guides/testing.md" }`. Los proyectos nuevos arrancan entonces con la compuerta de verificación desde el día uno. Los repos existentes no cambian nada hasta que edites `crew.json`; `/crew:setup` pregunta por esto y escribe solo lo que confirmes.

## Checklist

1. Agregá una fila `Total` a cualquier work item que estés por cerrar.
2. Decidí si querés la compuerta de verificación. Si sí, agregá `testing` a `crew.json` y llená `docs/guides/testing.md` (copialo de `templates/docs/guides/` del plugin).
3. Corré `/crew:setup` si preferís que te pregunten antes que editar JSON.
