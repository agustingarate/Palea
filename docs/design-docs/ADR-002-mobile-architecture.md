# ADR-002: Feature-first Clean Architecture with MVVM

Status: accepted

Each mobile feature owns data, domain, and presentation. React hooks implement
ViewModels. Expo Router is only a route adapter. A typed composition root injects
repositories and use cases; domain code is framework independent.
