# ADR-003: TanStack Query and Zustand

Status: accepted

TanStack Query exclusively owns remote asynchronous state. Zustand owns small
cross-screen client preferences such as theme. Feature-local UI state stays local.
