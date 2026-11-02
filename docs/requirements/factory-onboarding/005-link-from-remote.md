# 005 — El vínculo se resuelve desde el repositorio

- **Status:** Delivered
- **Plan:** factory-onboarding ([README](README.md))
- **Date:** 2026-11-02
- **Author role:** SYS, con SEC en el remoto, la búsqueda y la creación de proyectos
- **Branch:** main (the plugin ships from main; no feature branch)
- **Depends on:** [002](002-link-repo.md), y los cambios en factory de la sección [Vínculo automático](README.md#vínculo-automático-en-factory)

## Context

Hoy `/crew:factory link` muestra la lista de proyectos de la persona y espera que elija uno. Julio pidió que el vínculo salga del repositorio: si estamos trabajando en un repositorio, crew debería saber a qué proyecto pertenece y preguntar solo cuando falte algo. También pidió poder registrar desde el agente los proyectos que todavía no existen en factory.

Factory ya guarda los repositorios de cada proyecto como recursos técnicos del proyecto (`provider` y `owner/name` en GitHub), y su base de datos impide que un mismo repositorio pertenezca a dos proyectos.

## Decisiones de Julio (2026-11-02)

- **Cada persona ve solo los proyectos a los que tiene acceso.** La elección manual ofrece solo esos, así que el vínculo que escribe siempre apunta a un proyecto de la persona.
- **Sin acceso, se pide acceso.** Cuando el repositorio pertenece a un proyecto del que la persona no forma parte, crew le ofrece pedir acceso. La solicitud le llega a quien está a cargo del proyecto: su líder o su coordinador, o el cargo superior de la persona.
- **El MCP crea proyectos solo para quien tiene permiso para crearlos.** No hay solicitud de alta pendiente: sin permiso, crew dice que los proyectos los crea Gestión.

## Goal

- `link` lee el remoto del repositorio (`origin`, o el único remoto si hay uno solo) y lo reduce a proveedor y repositorio: en GitHub, `owner/name`; en otro host, `host/ruta`. En minúsculas y sin `.git`. Usuario, token, puerto, parámetros y cualquier ruta extra se descartan antes de que algo salga de la máquina, llegue al chat, a `crew.json` o a un log. Un remoto que no se puede reducir se informa como "remoto no reconocido", sin repetirlo.
- Con esa forma reducida pregunta a factory a qué proyecto pertenece el repositorio:
  - **Un proyecto de la persona:** escribe el id en `crew.json`, avisa qué hizo y no pregunta nada.
  - **Un proyecto del que la persona no forma parte:** responde siempre lo mismo, sin nombre ni id, y ofrece pedir acceso. La solicitud viaja con el repositorio reducido; factory sabe a quién mandarla y la persona no ve de qué proyecto se trata.
  - **Ningún proyecto:** muestra los proyectos de la persona y, si tiene permiso para crearlos, ofrece crear uno nuevo.
  - **Sin remoto:** la elección manual entre los proyectos de la persona.
- Al elegir un proyecto a mano, factory registra el repositorio en ese proyecto si la persona puede gestionar sus recursos técnicos. Si no puede, el vínculo queda en `crew.json` y `link` dice que el repositorio sigue sin registrar en factory.
- Crear un proyecto pide el nombre (por defecto, el del repositorio), el cliente (entre los que la persona ve) y la moneda (por defecto, la de la organización). El agente muestra todo y pregunta antes de crearlo. El repositorio queda registrado en el mismo paso.
- Un repositorio que ya tiene `factory.projectId` no se toca sin `--replace`.

## Contrato con factory

Herramientas del MCP de factory que usa `link`, acordadas con la sesión que implementa el backend. Factory registra cada herramienta solo para quien tiene su permiso, y crew pregunta primero cuáles tiene la persona (`tools/list`): una herramienta ausente, o una que factory rechaza por permisos, se lee como "sin permiso".

| Herramienta | Entrada | Respuesta |
|---|---|---|
| `find_project_by_repo` | `{ provider, repo }` | `{ match: "yours", project: { id, name } }`, `{ match: "other" }` o `{ match: "none" }` |
| `register_project_repo` | `{ projectId, provider, repo }` | `{ registered: true }`, o `{ registered: false, reason: "forbidden" \| "taken" }` |
| `list_clients` | `{}` | `{ clients: [{ id, name }], defaultCurrency }`, solo para quien puede crear proyectos |
| `create_project` | `{ name, clientId, currency, provider, repo }` | `{ project: { id, name } }` |
| `request_project_access` | `{ provider, repo }` | `{ requested: true }` |

`provider` es `github` u `other`; `repo` es la forma reducida. Factory vuelve a reducir lo que recibe con la misma regla, para que los dos lados no se separen.

## Areas to investigate

- Quién registró primero un repositorio ajeno: la base lo impide por unicidad, y la disputa la resuelve Gestión. Confirmar la propiedad del repositorio con la instalación de GitHub queda fuera de este plan.
- Si Codex expone las herramientas del MCP igual que Claude Code: `link` llama al MCP directo con el token, así que no depende del agente.

## Expected deliverable

- Lectura y reducción del remoto en una función pura con tests, incluido un remoto con token.
- `link` con resolución automática, pedido de acceso, registro en la elección manual y creación de proyecto.
- Llamadas a las herramientas de factory por `hooks/lib/factory-mcp.js`.
- Tests con el factory simulado, documentación EN y ES y paridad Codex.

## Estimation

| Milestone | Est. hours | Est. AI hours | Started | Finished | Actual hours | Actual AI hours | Notes |
|-----------|-----------|---------------|---------|----------|--------------|-----------------|-------|
| Lectura y reducción del remoto | 2 | 0.25 | 2026-11-02 20:36 -03:00 | 2026-11-02 20:44 -03:00 | — | — | scripts/lib/repo-remote.js; corta también rutas de GitLab y segmentos de puntos |
| Resolución automática en link y sus cuatro casos | 3 | 0.5 | — | 2026-11-02 20:44 -03:00 | — | — | scripts/factory-link.js; permisos leídos de tools/list y proyecto de la respuesta validado contra whoami. Inicio no registrado en el momento |
| Pedido de acceso | 1 | 0.25 | — | 2026-11-02 20:44 -03:00 | — | — | --request-access. Inicio no registrado en el momento |
| Registro del repositorio en la elección manual | 1.5 | 0.25 | — | 2026-11-02 20:44 -03:00 | — | — | register_project_repo después de escribir crew.json. Inicio no registrado en el momento |
| Creación de proyecto desde el agente | 2 | 0.25 | — | 2026-11-02 20:44 -03:00 | — | — | Chequeos del vínculo antes de crear; moneda por defecto de list_clients. Inicio no registrado en el momento |
| Tests | 2.5 | 0.5 | — | 2026-11-02 20:44 -03:00 | — | — | tests/factory-remote.test.js y tests/factory-link-remote.test.js, 13 casos. Inicio no registrado en el momento |
| Docs EN y ES y paridad Codex | 1.5 | 0.25 | — | 2026-11-02 20:44 -03:00 | — | — | docs/en|es/factory.md, commands/factory.md, CHANGELOG. Inicio no registrado en el momento |
| Revisión de SEC sobre la implementación | 0.5 | 0.25 | — | 2026-11-02 20:44 -03:00 | — | — | Aprobado con cinco correcciones, todas aplicadas. Inicio no registrado en el momento |
| Revisión de Julio | 0.5 | 0 | | | | | |
| **Total** | **14.5** | **2.5** | — | — | | | |

## Verification

| Scenario | Level | Harness | Artifact | Status |
|----------|-------|---------|----------|--------|
| Un remoto con token nunca aparece en la salida, crew.json ni lo que se envía | unit | node:test | tests/factory-remote.test.js | passing |
| Remotos https, ssh y con .git se reducen a la misma forma | unit | node:test | tests/factory-remote.test.js | passing |
| Un repositorio registrado en un proyecto de la persona se vincula sin preguntar | integration | node:test, factory simulado | tests/factory-link-remote.test.js | passing |
| Un repositorio de un proyecto ajeno devuelve la respuesta opaca y permite pedir acceso | integration | node:test, factory simulado | tests/factory-link-remote.test.js | passing |
| Sin coincidencia, link lista los proyectos y ofrece crear uno solo a quien puede | integration | node:test, factory simulado | tests/factory-link-remote.test.js | passing |
| La elección manual registra el repositorio, o dice que quedó sin registrar | integration | node:test, factory simulado | tests/factory-link-remote.test.js | passing |
| Crear un proyecto pide cliente y vincula el repositorio | integration | node:test, factory simulado | tests/factory-link-remote.test.js | passing |
| La resolución funciona contra el factory real de dev | e2e | manual | — | not verified — las herramientas de factory todavía no existen; las implementa la sesión del backend |

## Changes
