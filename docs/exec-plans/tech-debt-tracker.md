# Technical debt tracker

| ID     | Item                                                 | Trigger                                              |
| ------ | ---------------------------------------------------- | ---------------------------------------------------- |
| TD-001 | Select PostgreSQL ORM                                | Domain model and deployment target are known         |
| TD-002 | Configure auth and secure credential storage         | Authentication story is approved                     |
| TD-003 | Add EAS ownership and native identifiers             | First distributable build is planned                 |
| TD-004 | Execute Maestro in hosted emulator CI                | Stable mobile flow and runner budget exist           |
| TD-005 | Run durable CV reservation cleanup job               | Deploy scheduled worker with Storage retry semantics |
| TD-006 | Add timeout and cancellation to tRPC client requests | Any mobile flow depends on a remote API              |

## Sincronización con ClickUp

Para detectar las entradas nuevas agregadas en el diff actual de Git, ejecutar:

```bash
pnpm tech-debt:sync
```

El comando valida las filas y muestra las tareas candidatas, pero no modifica
ClickUp automáticamente. Luego invocar `$tech-debt-clickup-sync` para buscar
duplicados, verificar la lista `Palea Backlog`, mostrar el preview y solicitar
confirmación antes de crear las tareas.

Para obtener todas las entradas en formato JSON:

```bash
node scripts/tech-debt-sync.mjs --all --json
```

La sincronización usa el ID `TD-xxx` como clave de idempotencia y crea tareas
con el formato `[CHORE] TD-xxx <Item>`. El tracker Markdown permanece como
fuente de verdad.
