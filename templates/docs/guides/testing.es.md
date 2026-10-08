# Testing — qué verifica este proyecto, y cómo

La respuesta propia del proyecto a una pregunta que todo work item hace en planning: *este comportamiento tiene que quedar verificable — ¿en qué nivel, con qué arnés, y cuánto cuesta?*

Este archivo se instala **vacío a propósito**. El plugin trae la disciplina (todo work item declara cómo se verificó); los niveles, el arnés y la barra los declara este proyecto. Complétalo una vez, mantenlo vigente, y apunta `crew.json` `testing.guide` acá.

> Mientras este archivo no diga otra cosa, los roles reportan que el proyecto no declara estrategia de testing — y un plan que la necesite lo dirá en vez de inventarla.

## Niveles en uso

Qué protege cada nivel acá, y qué deliberadamente no.

| Nivel | Qué cubre | Dónde vive | Cómo corre |
|-------|-----------|------------|------------|
| unit | | | |
| integration | | | |
| contract | | | |
| e2e | | | |

Niveles que este proyecto **no** usa, y por qué: (escríbelo — un nivel ausente que nadie decidió omitir es un hueco; uno decidido es una política.)

## Arnés

- **End-to-end:** (herramienta, archivo de configuración, dónde viven las specs, cómo se nombra una spec. Refléjalo en `crew.json` `testing.e2e` para que los roles lo lean de un solo lugar.)
- **Runner / aserciones:** (…)
- **Fixtures y datos:** (qué puede asumir existente un test, qué crea, qué debe limpiar.)
- **Trampas de configuración:** (los ajustes que una spec nueva se equivoca la primera vez — base URL, destino del proxy, bypass de auth, zona horaria, usuarios sembrados.)

## Qué exige un contrato en píxeles

Una regla que conviene dejar escrita antes del primer test visual: **un contrato expresado en geometría se verifica midiendo.** Leer nombres de clases o mirar una captura no alcanza. Un test que aserta sobre el string de clases pasa mientras el layout está roto, porque otra regla lo pisó en CSS. Lo que corre sin motor de layout real no puede responder una pregunta geométrica, así que esas aserciones van al nivel que corre en navegador o no van.

## Barra de adopción

Qué tiene que ser cierto antes de que un cambio se integre. Escribe las compuertas como condiciones verificables:

1. (p. ej. todo comportamiento nuevo tiene al menos un test en el nivel que esta tabla le asigna.)
2. (p. ej. todo bug corregido deja un test de regresión que falla contra el código viejo.)
3. (…)

Una compuerta solo obliga si algo la ejecuta. Nombra dónde ocurre eso — workflow de CI, pre-commit, paso manual — y dilo sin adornos si hoy la respuesta es "en ningún lado".

## Testing manual

La parte que ningún arnés cubre. Si hay personas probando este producto, el protocolo es de ellas y se sigue sin leer código:

- **Quién** — los perfiles que existen y qué puede hacer cada uno.
- **Cómo entran** — el punto de entrada y la política de credenciales (que los testers tengan credenciales reales es un hallazgo de seguridad).
- **Rondas** — qué se recorre, en qué orden, con qué presupuesto de tiempo.
- **Qué reportan** — los campos de un reporte, y una escala de severidad escrita en palabras y no en números.
- **Condiciones obligatorias** — los estados que esconden defectos hasta que alguien mira: datos vacíos, una vista con volumen alto, un flujo interrumpido, la pantalla más chica soportada.

## Qué no se verifica

La lista honesta. Cada entrada: qué queda descubierto, por qué, y qué tendría que existir para cubrirlo. Esta sección es la que mantiene una estimación veraz — el trabajo que no está escrito acá aparece recién después de estimar.
