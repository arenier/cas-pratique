# Shared Backend Foundation

This package provides infrastructure-level building blocks for the backend:

- Mock auth guard that builds a request-scoped `AuthUser` from headers.
- Tenancy guard to enforce organization scoping.
- RBAC decorator + guard for controller-level authorization.
- Global domain error filter to map domain errors to HTTP responses.

The goal is to keep domain aggregates pure while centralizing cross-cutting
concerns in a reusable, framework-aware layer.
