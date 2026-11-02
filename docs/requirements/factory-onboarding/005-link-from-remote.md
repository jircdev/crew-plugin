# 005 — El vínculo se resuelve desde el repositorio

- **Status:** Draft
- **Plan:** factory-onboarding ([README](README.md))
- **Date:** 2026-11-02
- **Author role:** SYS, con SEC en el remoto, la búsqueda y la creación de proyectos
- **Branch:** main (the plugin ships from main; no feature branch)
- **Depends on:** [002](002-link-repo.md), y los cambios en factory de la sección [Vínculo automático](README.md#vínculo-automático-en-factory)

## Context

Hoy `/crew:factory link` muestra la lista de proyectos de la persona y espera que elija uno. Julio pidió que el vínculo salga del repositorio: si estamos trabajando en un repositorio, crew debería saber a qué proyecto pertenece y preguntar solo cuando falte algo. También pidió poder registrar desde el agente los proyectos que todavía no existen en factory.

Factory ya guarda los repositorios de cada proyecto como recursos técnicos del proyecto (`provider` y `owner/name` en GitHub), y su base de datos impide que un mismo repositorio pertenezca a dos proyectos.

## Goal

- `link` lee el remoto del repositorio (`origin`, o el único remoto si hay uno solo) y lo reduce a proveedor y `owner/name`, en minúsculas y sin `.git`. Usuario, token, puerto, parámetros y cualquier ruta extra se descartan antes de que algo salga de la máquina, llegue al chat, a `crew.json` o a un log. Un remoto que no se puede reducir a esa forma se informa como "remoto no reconocido", sin repetirlo.
- Con esa forma reducida pregunta a factory a qué proyecto pertenece el repositorio:
  - **Un proyecto en el que la persona participa:** escribe el id en `crew.json`, avisa qué hizo y no pregunta nada.
  - **Un proyecto en el que la persona no participa:** responde siempre lo mismo, sin nombre ni id: el repositorio pertenece a un proyecto de factory del que no forma parte, y puede pedirle a su líder que la sume.
  - **Ningún proyecto:** muestra los proyectos de la persona y ofrece crear uno nuevo.
- Cuando la persona elige un proyecto a mano, factory registra el repositorio en ese proyecto si la persona tiene permiso para gestionar sus recursos técnicos. Si no lo tiene, el vínculo queda solo en `crew.json` y `link` dice que el repositorio sigue sin registrar en factory.
- Crear un proyecto pide el nombre (por defecto, el del repositorio), el cliente (entre los que la persona ve) y la moneda (por defecto, la de la organización). El agente muestra todo y pregunta antes de crearlo. El repositorio queda registrado en el mismo paso. Sin permiso para crear proyectos, `link` dice que los crea Gestión en la aplicación; cuando el proyecto existe, un nuevo `link` lo encuentra solo.
- Sin remoto, queda la elección manual de hoy.
- Un repositorio que ya tiene `factory.projectId` no se toca sin `--replace`.

## Areas to investigate

- **Decisión de Julio:** qué escribe la elección manual de alguien sin permiso de gestión. SYS propone escribir `crew.json` como hoy, sin registrar el repositorio en factory. SEC propone que, mientras nadie con permiso confirme el vínculo, solo el tiempo propio de esa persona vaya a ese proyecto, porque un `crew.json` commiteado manda ahí el tiempo de todo el equipo.
- **Decisión de Julio:** una solicitud de alta pendiente para quien no puede crear proyectos. SYS la saca de este plan: factory no tiene un circuito de aprobación de proyectos, y sumarlo es una entidad nueva con su pantalla para Gestión. Si se quiere, va como requirement propio en factory.
- Quién registró primero un repositorio ajeno: la base lo impide por unicidad, y la disputa la resuelve Gestión. Confirmar la propiedad del repositorio con la instalación de GitHub queda fuera de este plan.
- Remotos fuera de GitHub: proveedor `other` con `host/ruta` como id.

## Expected deliverable

- Lectura y reducción del remoto en una función pura con tests, incluido un remoto con token.
- `link` con resolución automática y los cuatro casos.
- Llamadas a las herramientas nuevas de factory por `hooks/lib/factory-mcp.js`.
- Tests con el factory simulado, documentación EN y ES y paridad Codex.

## Estimation

| Milestone | Est. hours | Est. AI hours | Started | Finished | Actual hours | Actual AI hours | Notes |
|-----------|-----------|---------------|---------|----------|--------------|-----------------|-------|
| Lectura y reducción del remoto | 2 | 0.25 | | | | | |
| Resolución automática en link y sus cuatro casos | 3 | 0.5 | | | | | |
| Registro del repositorio en la elección manual | 1.5 | 0.25 | | | | | |
| Creación de proyecto desde el agente | 2 | 0.25 | | | | | |
| Tests | 2.5 | 0.5 | | | | | |
| Docs EN y ES y paridad Codex | 1.5 | 0.25 | | | | | |
| Revisión de SEC sobre la implementación | 0.5 | 0.25 | | | | | |
| Revisión de Julio | 0.5 | 0 | | | | | |
| **Total** | **13.5** | **2.25** | — | — | | | |

## Verification

| Scenario | Level | Harness | Artifact | Status |
|----------|-------|---------|----------|--------|
| Un remoto con token nunca aparece en la salida, crew.json ni lo que se envía | unit | node:test | tests/factory-link.test.js | not run |
| Remotos https, ssh y con .git se reducen a la misma forma | unit | node:test | tests/factory-link.test.js | not run |
| Un repositorio registrado en un proyecto de la persona se vincula sin preguntar | integration | node:test, factory simulado | tests/factory-link.test.js | not run |
| Un repositorio de un proyecto ajeno devuelve la respuesta opaca, sin nombre ni id | integration | node:test, factory simulado | tests/factory-link.test.js | not run |
| Sin coincidencia, link lista los proyectos y ofrece crear uno | integration | node:test, factory simulado | tests/factory-link.test.js | not run |
| Sin permiso de gestión, la elección manual no registra el repositorio en factory | integration | node:test, factory simulado | tests/factory-link.test.js | not run |
| Sin permiso de creación, link remite a Gestión | integration | node:test, factory simulado | tests/factory-link.test.js | not run |
| La resolución funciona contra el factory real de dev | e2e | manual | — | not run |

## Changes
