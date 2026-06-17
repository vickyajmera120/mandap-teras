# Code Style & Conventions

> **Always in context.** Follow these conventions for all generated code.

---

## Java / Spring Boot Backend

### General
- **Java version**: 17 (no preview features)
- **Spring Boot**: 3.2.x (use Spring Boot 3 idioms, not legacy Spring 4 patterns)
- **Lombok**: Use `@Slf4j`, `@Data`, `@Getter`, `@Setter`, `@NoArgsConstructor`, `@AllArgsConstructor`, `@Builder` — **do not** write boilerplate getters/setters manually

### Naming Conventions
| Element | Convention | Example |
|---------|-----------|---------|
| Entity class | PascalCase, singular noun | `RentalOrder`, `BillItem` |
| DTO class | PascalCase + `DTO` suffix | `RentalOrderDTO`, `PaymentDTO` |
| Controller | PascalCase + `Controller` suffix | `BillController` |
| Service | PascalCase + `Service` suffix | `RentalOrderService` |
| Repository | PascalCase + `Repository` suffix | `BillRepository` |
| REST endpoints | Lowercase, plural, kebab-case | `/api/rental-orders`, `/api/bill-items` |
| DB tables | snake_case, plural | `rental_orders`, `bill_items` |
| DB columns | snake_case | `dispatch_date`, `created_at` |
| Enums | UPPER_SNAKE_CASE values | `BOOKED`, `DISPATCHED`, `PARTIALLY_RETURNED` |

### Dependency Injection
- Use **`@Autowired`** field injection (this is the existing project pattern)
- For new services, **constructor injection** is preferred but align with existing code

### API Response Wrapper
All API endpoints must wrap responses in `ApiResponse<T>`:
```java
return ResponseEntity.ok(new ApiResponse<>(true, "Message", data));
```

### Error Handling
- Return appropriate HTTP status codes (400, 401, 403, 404, 500)
- Use `RuntimeException` subclasses for business errors
- Never expose raw exception messages to the client

### JPA / Hibernate
- Use `@Audited` (Hibernate Envers) on entities that need audit trails
- Respect `CascadeType.ALL` for parent-child relationships (Bill → BillItems, Bill → Payments)
- Use `orphanRemoval = true` where appropriate
- Flyway manages the schema — entities must match migration state exactly

---

## Angular / TypeScript Frontend

### General
- **Angular**: 21 (latest), **standalone components only** (no NgModules)
- **Styling**: Tailwind CSS 4 + DaisyUI 5 (use DaisyUI component classes first, then Tailwind utilities)
- **State**: Use Angular Signals where possible, RxJS for async streams
- **Forms**: Reactive Forms with `FormBuilder`
- **Lazy Loading**: All feature routes use `loadComponent` dynamic imports

### Project Structure
```
mandap-ui/src/app/
├── core/              # Singletons: services, guards, interceptors, models
│   ├── services/      # HttpClient-based services (one per domain)
│   ├── guards/        # authGuard, adminGuard (functional guards)
│   ├── interceptors/  # authInterceptor, errorInterceptor (functional)
│   └── models/        # TypeScript interfaces (*.model.ts)
├── features/          # Feature-scoped standalone components
│   ├── auth/          # Login
│   ├── billing/       # Bill creation, history, print
│   ├── customers/     # Customer CRUD, audit log
│   ├── dashboard/     # Overview metrics, charts (ECharts)
│   ├── inventory/     # Stock management, audit log
│   ├── rental-orders/ # Booking, dispatch, returns, audit log
│   ├── users/         # User management (admin only)
│   └── roles/         # Role management (admin only)
├── shared/            # Reusable components and pipes
│   ├── components/    # Modal, Sidebar, Loading Spinner
│   └── pipes/         # Custom pipes
└── layouts/           # MainLayout, AuthLayout
```

### Naming Conventions
| Element | Convention | Example |
|---------|-----------|---------|
| Component file | kebab-case + `.component.ts` | `new-bill.component.ts` |
| Service file | kebab-case + `.service.ts` | `rental-order.service.ts` |
| Model file | kebab-case + `.model.ts` | `rental-order.model.ts` |
| Guard file | kebab-case + `.guard.ts` | `auth.guard.ts` |
| CSS classes | Tailwind utilities + DaisyUI | `btn btn-primary`, `glass` |

### Prettier Config (enforced)
```json
{
  "printWidth": 100,
  "singleQuote": true,
  "overrides": [{ "files": "*.html", "options": { "parser": "angular" } }]
}
```

### UI/UX Design System
- **Theme**: Glassmorphism aesthetic with `glass` DaisyUI utility
- **Dark/Light Mode**: Supported via DaisyUI theme toggle
- **Icons**: FontAwesome 6/7 (`@fortawesome/fontawesome-free`)
- **Charts**: ECharts via `ngx-echarts`
- **Toasts**: Toastr for notifications
- **Dropdowns**: `@ng-select/ng-select` for searchable selects
- **Bilingual**: Items display both English and Gujarati names

---

## Flyway Migrations

- **Location**: `src/main/resources/db/migration/`
- **Naming**: `V{N}__{description}.sql` (double underscore)
- **Current version**: V11
- **Next migration**: `V12__description.sql`
- Always test migrations against a fresh `mandap_billing` database before committing
