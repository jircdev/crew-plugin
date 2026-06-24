# Instalación

El id del plugin es `crew@factory-crew` (marketplace `factory-crew`, plugin `crew`). La instalación se configura en tu `settings.json` de usuario — **no** mediante `/plugin marketplace add`, que solo registra una ruta en tu propia máquina.

- macOS/Linux: `~/.claude/settings.json`
- Windows: `C:\Users\<usuario>\.claude\settings.json`

Declaras el marketplace bajo `extraKnownMarketplaces` y habilitas el plugin bajo `enabledPlugins`. Elige **uno** de los dos flujos siguientes.

> **¿Editas `settings.json` a mano?** Agrega estas dos claves al archivo que ya existe — no reemplaces el archivo entero. Mantén el JSON válido: cada `{` necesita su `}`, y sin coma después del último elemento de un bloque. Una sola coma de más impide que el archivo cargue y el plugin no aparecerá.

## Consumidor (recomendado — instala desde GitHub)

Para cualquiera que use el plugin sin editarlo. Resuelve en cualquier máquina.

```json
{
  "extraKnownMarketplaces": {
    "factory-crew": {
      "source": {
        "source": "github",
        "repo": "jircdev/crew-plugin"
      }
    }
  },
  "enabledPlugins": {
    "crew@factory-crew": true
  }
}
```

## Autor / desarrollo local (edita el working tree)

Para mantenedores que editan el plugin y quieren que su clon local sea la fuente viva. Idéntico a la config de consumidor salvo que el `source` del marketplace apunta a la ruta del clon — por eso resuelve **solo** en tu máquina.

```json
{
  "extraKnownMarketplaces": {
    "factory-crew": {
      "source": {
        "source": "directory",
        "path": "C:/w/crew-plugin"
      }
    }
  },
  "enabledPlugins": {
    "crew@factory-crew": true
  }
}
```

## Reiniciar y verificar

`settings.json` solo se lee al arrancar, así que **cierra Claude Code por completo y vuelve a abrirlo** tras editarlo — recargar no basta.

**¿Funcionó?** Escribe `/crew:` en el prompt. Si autocompletan los comandos de rol (`/crew:sys`, `/crew:da`, …), listo. Si no aparece nada, el plugin no cargó — ver [Solución de problemas](#solución-de-problemas).

En la primera sesión tras habilitarlo, Claude Code te pide aprobar los hooks del plugin — una sola vez; acéptalo. Si nunca ves ese aviso pero los comandos aparecen, los hooks ya estaban aprobados — no pasa nada.

## Actualizar el plugin

Los consumidores ejecutan `/plugin update crew@factory-crew`. Las instalaciones autor/local consumen el working tree directamente — basta con hacer pull. Para cambios en plantillas, los proyectos existentes re-ejecutan `bin/init-project.sh` (que salta los archivos ya existentes) o fusionan la nueva plantilla a mano.

## Desinstalar el plugin

Desinstalar es la instalación al revés — edita el mismo `settings.json`:

1. Borra la entrada `"crew@factory-crew": true` de `enabledPlugins`.
2. Borra el bloque `factory-crew` de `extraKnownMarketplaces`.
3. Reinicia Claude Code.

El botón **Remove** de la interfaz por sí solo no basta: limpia la caché del plugin pero no `settings.json`, así que al arrancar de nuevo el marketplace se re-registra desde el archivo y el chip reaparece. `settings.json` es la fuente de verdad — quita las entradas ahí. Para purgar el registro sobrante sin esperar al reinicio, también puedes vaciar `~/.claude/plugins/known_marketplaces.json` (Windows: `C:\Users\<usuario>\.claude\plugins\known_marketplaces.json`) a `{}`.

## Solución de problemas

- **El plugin nunca aparece / `/crew:*` no se encuentra.** Verifica que la clave de settings sea exactamente `extraKnownMarketplaces`. Una clave llamada `marketplaces` se ignora en silencio — el marketplace nunca se registra y nada da error.
- **Funciona para ti pero no para tu equipo.** El `source` del marketplace es `directory` con una `path` local. Una ruta local solo existe en tu máquina; los demás deben usar el `source` `github` de arriba.
- **Editaste settings pero nada cambió.** No reiniciaste. Claude Code solo lee `settings.json` al arrancar.
- **Lo desinstalaste pero el chip sigue volviendo.** El Remove de la interfaz no edita `settings.json`. Ver [Desinstalar el plugin](#desinstalar-el-plugin) arriba.
- **Instalado pero no aparecen los comandos `/crew:`.** El marketplace se registró pero el plugin no terminó de cargar. Cierra Claude Code por completo (no solo recargar) y vuelve a abrirlo. Si sigue sin aparecer, quita `crew@factory-crew` desde el menú `/plugin` y vuelve a añadirlo. Los mantenedores con un clon local pueden cambiar el `source` del marketplace a `directory` (ver el flujo de autor arriba), que carga el plugin en sitio y evita el paso de descarga.
