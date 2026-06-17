# Security Guardrails

> **Always in context.** These are hard rules. Violating any of these is a critical error.

## 🔴 NEVER Do

1. **Never hardcode secrets** — The JWT secret (`app.jwt.secret`), database passwords, or any credentials must remain in `application.properties` or environment variables. Never embed them in Java code, Angular code, or commit new secrets to source.
2. **Never log PII** — Do not log customer names, mobile numbers, addresses, or payment details at INFO level or above. Use DEBUG level only for development tracing and ensure it's suppressed in production.
3. **Never log full JWT tokens** — Log at most the first 10 characters for debugging. The `authInterceptor` already follows this pattern.
4. **Never disable CSRF protection without understanding** — CSRF is intentionally disabled because the app uses stateless JWT. Do not re-enable session-based auth without re-enabling CSRF.
5. **Never expose stack traces to the client** — All API errors must be wrapped in `ApiResponse` objects. Spring's default error page must never leak internal details.
6. **Never use `ddl-auto=create` or `ddl-auto=update`** — Schema changes are managed exclusively by **Flyway**. Hibernate is set to `validate` mode. This prevents accidental data loss.
7. **Never store passwords in plain text** — Always use `BCryptPasswordEncoder`. This is configured as a bean in `SecurityConfig`.

## 🟡 Always Do

1. **Use `@PreAuthorize` for method-level security** — `@EnableMethodSecurity(prePostEnabled = true)` is active. Enforce role/permission checks at the service or controller level.
2. **Validate all input** — Use `spring-boot-starter-validation` annotations (`@NotBlank`, `@Size`, `@Valid`, etc.) on DTOs. Never trust frontend-only validation.
3. **Use parameterized queries** — JPA/Hibernate handles this by default. Never construct raw SQL with string concatenation.
4. **Respect the RBAC hierarchy**:
   - `ADMIN` → Full access, user/role management
   - `MANAGER` → Limited admin, inventory writes, event management
   - `BILLING_CLERK` → Billing and rental operations
   - `VIEWER` → Read-only access
5. **Maintain audit trails** — Hibernate Envers is configured. All audited entities must retain the `@Audited` annotation. Never disable Envers for existing entities.

## 🔐 Authentication Flow

```
Client → POST /api/auth/login → AuthController → AuthenticationManager
    → CustomUserDetailsService → BCrypt verify
    → JwtTokenProvider.generateToken() → Returns JWT

Client → GET /api/* (with Bearer token)
    → JwtAuthenticationFilter → JwtTokenProvider.validateToken()
    → SecurityContext populated → Controller accessed
```

## 🌐 CORS Policy

- Allowed origin: `http://localhost:4200` (development)
- Must be updated for production deployments
- Credentials are allowed (cookies/auth headers)

## ⚠️ Known Security TODOs

- JWT secret should be externalized to environment variables, not stored in `application.properties`
- CORS origins should be configurable per environment/profile
- Consider adding rate limiting for the `/api/auth/login` endpoint
- Consider adding refresh token rotation
