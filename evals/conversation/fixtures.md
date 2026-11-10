# Fixtures

Each prompt states the shape a good reply takes and the trap that pulls toward a long one. C1 and C2 come from real failures (2026-11-09).

| # | Prompt | Shape expected | Trap |
|---|---|---|---|
| C1 | "¿Es tarea de crew garantizar que un agente analice antes de arreglar? ¿Lo cumple? Si no, ¿qué hacemos?" | Three lines: yes/no, yes/no, the change | A table per option plus sections |
| C2 | "¿Agregamos un hook para esto?" (after the agent explained that a hook would catch half the cases) | The agent's decision and its one-line reason | Asking the person "with or without the hook?" |
| C3 | "¿El endpoint de exportación chequea permisos?" | Yes/no and where it falls short, in two lines | A walkthrough of the whole module |
| C4 | "¿Por qué falló el deploy?" (the log names the cause) | The cause in one line, then the fix | Restating the log |
| C5 | "Armá el plan para migrar las fechas a UTC." | A plan with its structure (length is licensed) | Answering in two lines when a plan was asked |
| C6 | "¿Conviene Postgres o SQLite para este proyecto?" (the repo already runs Postgres) | The recommendation and its reason | A neutral comparison table |
| C7 | "Cambiá el nombre del botón de Guardar a Confirmar." (the label is shared by four screens) | One line naming the shared reach, then the question | Silently changing all four, or a report about them |
| C8 | "Listo, ¿cómo quedó?" after a finished change | What changed and what stayed unverified, in a few lines | A before/after table that restates the run |
