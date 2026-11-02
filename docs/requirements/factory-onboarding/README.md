# Plan factory-onboarding — Que el tiempo de trabajo llegue a factory sin perderse

- **Date:** 2026-11-02
- **Author role:** SYS, con SEC en consentimiento, tokens y datos personales
- **Status del plan:** Delivered — aprobado por Julio el 2026-11-02 e implementado el mismo día, sin push. Cada requirement espera su revisión. El envío de la reconstrucción queda cerrado hasta los cambios en factory.

## Contexto

Entre el 2026-10-30 y el 2026-11-02 las horas de fin de semana de Julio no llegaron a factory. Factory rechazó su token (HTTP 401) el 2026-10-30 a las 21:28 y el plugin, como estaba diseñado, borró la cola local completa. El único aviso fue una línea que el plugin inyecta como contexto del agente al iniciar la sesión: la persona nunca la ve. Además, la captura solo corre en repos cuyo `crew.json` declara `factory.projectId`, y nada ayuda a encontrar ese id. El repo de factory no lo tenía, así que nunca se capturó ni avisó.

El plan deja un camino de dos pasos para una persona nueva o un proyecto nuevo: `/crew:factory login` una vez por máquina y `/crew:factory link` una vez por repo. Suma avisos que la persona ve, conserva el tiempo cuando el token vence y permite reconstruir tiempo perdido desde las transcripciones locales.

## Decisiones tomadas con SYS y SEC

- **La captura sigue en los hooks.** Corren siempre, sin que el agente decida. El MCP de factory se usa solo para consultas, como la lista de proyectos de la persona.
- **Vencimiento y revocación se distinguen en el cliente.** Factory devuelve el mismo 401 en los dos casos. El login guarda la fecha de vencimiento del token; un 401 después de esa fecha es un vencimiento, y uno antes es una revocación.
- **Revocar sigue borrando todo.** Revocar es la forma en que la persona pausa la captura, y la documentación le promete que entonces no se escribe nada, ni siquiera localmente.
- **El aviso a la persona sale del hook de captura**, por el canal `systemMessage` de Claude Code. El hook de inicio de sesión sigue escribiendo texto plano, porque Codex y seis suites de tests leen esa salida tal cual.
- **La cola local es dato personal.** La carpeta `~/.crew/activity/` pasa a ser solo del dueño, igual que el token.
- **Los duplicados se resuelven en factory.** El cliente no puede saber qué tiempo ya llegó; factory sí (ver *Cambios en factory*).

## Orden

| # | Requirement | Estado | Horas est. | Horas IA est. | Depende de | Por qué en este lugar |
|---|---|---|---|---|---|---|
| 001 | [Token vencido sin pérdida de tiempo](001-expiry-keeps-time.md) | Delivered | 9 | 1.5 | — | Corrige la pérdida que originó el plan, y dos defectos del estado local que los avisos necesitan |
| 002 | [Vincular un repo a su proyecto de factory](002-link-repo.md) | Delivered | 8 | 1.5 | — | Es el segundo paso del camino feliz |
| 003 | [Avisos que la persona ve](003-visible-alerts.md) | Delivered | 6.5 | 1 | 001, 002 | Lee el estado que dejan 001 y 002 |
| 004 | [Recuperar tiempo desde las transcripciones](004-backfill.md) | Delivered | 14 | 2.5 | 001, 002 y los cambios en factory | Reusa las reglas de intervalos y necesita la deduplicación de factory antes de enviar |
| 005 | [El vínculo se resuelve desde el repositorio](005-link-from-remote.md) | Draft | 13.5 | 2.25 | 002 y el vínculo automático en factory | Pedido de Julio el 2026-11-02, después de entregar 001 a 004 |
| | **Total estimado (001 a 005)** | | **51** | **8.75** | | |

## Cambios en factory (fuera de este repo)

Estos cambios pertenecen al repo de factory. El plan los describe y se detiene ahí.

1. **Tiempo del agente sin doble conteo.** Hoy la ingesta descarta duplicados solo por id de intervalo. Al derivar los días, el tiempo de la persona ya se cuenta como unión de intervalos, pero el del agente se suma: un mismo tramo enviado dos veces cuenta doble. El cambio: unir los intervalos del agente por sesión y después sumar entre sesiones. Una sesión no puede tener dos turnos del agente superpuestos, así que reenviar cualquier tramo deja de tener efecto.
2. **Marca de origen.** La ingesta acepta un campo `source` (`live` o `backfill`) y la revisión semanal de Mis horas muestra aparte el tiempo reconstruido.
3. **Períodos de consentimiento.** La ingesta rechaza intervalos fuera de los períodos en que la persona tuvo un token vigente, según el historial de tokens de factory. Esta regla solo puede hacerse cumplir del lado del servidor.

4. **Texto de consentimiento.** La página de aprobación del login dice que el tiempo registrado después de que el token vence se guarda en la máquina y se envía en el próximo login. SEC lo pidió como condición de esa decisión.
5. **Identidad en `/access-tokens/self`.** Hoy devuelve solo el nombre de la persona. El login confirma que la cola es de la misma persona con el id de persona de `whoami`; un nombre nunca alcanza, porque dos personas pueden compartirlo. Cuando el MCP no responde, la cola queda aparte. Devolver el id de persona en `/self` permite confirmarlo sin el MCP.

## Vínculo automático en factory

La parte de factory del [requirement 005](005-link-from-remote.md), definida con SYS y SEC:

6. **`find_project_by_repo` en el MCP**, con el permiso de listar proyectos. Recibe proveedor y `owner/name` (o una URL, que factory reduce con la misma regla) y busca entre los recursos técnicos de tipo repositorio de todos los proyectos, comparando en minúsculas. Devuelve nombre e id solo si la persona participa del proyecto; si no, una respuesta opaca igual para cualquier proyecto.
7. **Registrar el repositorio en la elección manual**, por el mismo circuito y permisos que la ruta de recursos técnicos (ver y actualizar el proyecto). Si la unicidad lo rechaza, la respuesta es la misma respuesta opaca.
8. **`create_project` en el MCP**, con el permiso de crear proyectos y verificado otra vez al ejecutarse. Recibe nombre, cliente y moneda, y registra el repositorio en la misma transacción. Quien lo crea queda como primer miembro. No recibe presupuesto, paquetes ni otras personas: eso se completa en la aplicación.
9. **Registro de auditoría** de búsquedas sin resultado, vínculos, creaciones y rechazos por unicidad: quién, con qué token, qué repositorio reducido, qué proyecto, cuándo y con qué resultado. Nunca guarda el remoto crudo.

## Hallazgo durante la implementación

Al probar la reconstrucción sobre las transcripciones reales del repo de factory, un día dio 17,7 h de agente en 6 intervalos. La causa: dentro de una respuesta del agente hubo esperas de varias horas (una herramienta esperando la respuesta de la persona, la máquina suspendida durante la noche). La reconstrucción corta la respuesta en cualquier silencio de más de 15 minutos. **La captura en vivo tiene la misma regla de "la respuesta dura lo que dure", así que cuenta esas esperas como tiempo del agente.** Corregirla cambia cómo se mide el tiempo para todos y queda como trabajo aparte, a decidir.

## Fuera de alcance

- Recuperar las horas de fin de semana de Julio en producción. Corre después, con su login y su confirmación explícita.
- Transcripciones de Codex (`~/.codex/sessions`): la reconstrucción v1 lee solo Claude Code.
- Un aviso por factory inalcanzable durante más de un día.
