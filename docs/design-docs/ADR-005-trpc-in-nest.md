# ADR-005: tRPC inside Nest

Status: accepted

Mount the official tRPC Express middleware at `/trpc` in the Nest HTTP process.
Nest supplies request context and use-case ports. Routers are thin adapters and do
not own persistence or business rules.
