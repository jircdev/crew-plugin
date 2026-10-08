# Migración a 0.24 — `bin/` pasa a ser `scripts/`

Un solo cambio, mecánico, con **una acción obligatoria** en cualquier repo que instalara el gate de calidad antes de esta versión.

## Qué cambió, en un párrafo

El directorio de ejecutables del plugin dejó de llamarse `bin/` y pasa a llamarse `scripts/`. Los cuatro ejecutables (`init-project.sh`, `metrics.js`, `check-quality.sh`, `check-staged.js`) son idénticos: solo se movieron. El motivo: un `bin/` de primer nivel hace que el validador de las instalaciones alojadas en claude.ai rechace el plugin entero — en la CLI su contenido se añade al `PATH`, pero no aparece en la superficie de aprobación del administrador, así que tanto el sync del marketplace desde la app de escritorio como un `.plugin` empaquetado fallan con `Plugin contains a top-level bin/ directory`. Con `bin/` el plugin solo era instalable por CLI.

## La acción obligatoria: el hook de pre-commit

`scripts/init-project.sh` instala el gate como `.git/hooks/pre-commit` con una ruta **absoluta** al plugin. Todo repo scaffoldeado antes de 0.24 tiene ahí una línea que apunta a `bin/check-quality.sh`, una ruta que ya no existe.

Esto no falla ruidosamente: el hook deja de resolver y el gate se calla. Un commit que antes se bloqueaba, ahora pasa.

**El arreglo, desde la raíz del proyecto:**

```bash
bash /ruta/al/crew-plugin/scripts/init-project.sh
```

El script detecta el hook antiguo, reescribe la ruta en su sitio y lo reporta como `migrated:`. No toca ningún otro archivo ya existente. Si prefieres editarlo a mano, es una sustitución de texto en `.git/hooks/pre-commit`:

```
bin/check-quality.sh   →   scripts/check-quality.sh
```

## Qué más hay que revisar

| Dónde | Qué buscar |
|---|---|
| CI | cualquier paso que invoque `crew-plugin/bin/...` |
| Alias y scripts propios | rutas al plugin escritas a mano |
| `AGENTS.md` del proyecto | referencias al directorio `bin/` del plugin |

## Qué no hay que hacer

- **Las instalaciones por CLI no requieren nada**: `/plugin update crew@factory-crew` y listo. El renombrado es interno al plugin.
- **Las instalaciones de autor / dev local** que consumen el working tree solo necesitan `git pull`.
- **No cambia ninguna regla, gate ni contrato de `crew.json`.** Cambia solo la ruta; el comportamiento sigue igual.

## Checklist

1. Vuelve a ejecutar `scripts/init-project.sh` en cada repo que tuviera el gate instalado.
2. Comprueba que `.git/hooks/pre-commit` apunta a `scripts/check-quality.sh`.
3. Busca `bin/` en tu CI y en tus alias.
