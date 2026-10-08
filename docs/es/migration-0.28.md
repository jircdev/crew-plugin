# Migración a 0.28 — revisiones comprobables y ceremonia a la medida del pedido

Aditiva. **No requiere ninguna acción.** Una corrección cambia números que quizás leíste antes.

## Qué cambió, en un párrafo

Toda revisión reporta ahora sus hallazgos con una sola forma (`standards/findings.md`): severidad en una escala única que comparten QA y diseño, el rol dueño de la decisión violada, evidencia, base y acción; los hallazgos bloqueantes se vuelven a revisar intentando refutarlos. `/crew:check` corre los comandos de test que declara `crew.json` y escribe un recibo con hash por corrida, y `testing.receipts: true` hace que una fila de verificación `passing` cierre solo con uno. Las stories suman una sección "Must not". Los pedidos se dimensionan (trivial, small, standard, large) con una rúbrica en el circuito de entrega; el tamaño quita pasos, nunca cierres, y `/crew:metrics` informa el desvío por tamaño.

## Una corrección a `/crew:metrics`

Desde la 0.23 la tabla de estimación cierra con una fila **Total**, y `metrics.js` contaba esa fila como un hito más: las horas estimadas y reales de cada item salían **duplicadas** (el porcentaje de desvío no se veía afectado). La 0.28 saltea la fila Total. Si exportaste `docs/work/metrics.csv` entre la 0.23 y la 0.27, regeneralo.

## Qué podés activar

| Agregás | Obtenés |
|---|---|
| `testing.receipts: true` (con `testing.commands`) | las filas `passing` cierran solo si citan un recibo de `/crew:check` |
| `- **Size:** small` en un work item | el aviso de alcance cuando el cambio lo excede; desvío por tamaño en métricas |
| `## Must not` en tu propia plantilla de stories | QA revisa cada línea como un criterio propio |

Los proyectos conservan sus plantillas: la sección "Must not" y el campo `Size:` llegan solo en plantillas recién generadas, o cuando los agregás a la tuya.
