---
name: api-generator
description: Playbook for creating a new REST endpoint end-to-end
---

# API Generator Skill

## The "Mandap Flow"
Follow these steps to add a new feature or domain to the system:

### 1. Database (The Foundation)
- Create a Flyway migration (`.sql`).
- Include audit tables (`_aud`) if tracking history.

### 2. Entity (The Source of Truth)
- Create Java `@Entity` in `com.mandap.entity`.
- Add `@Data`, `@NoArgsConstructor`, `@AllArgsConstructor`, `@Builder`, `@Audited`.
- Define relationships (`@OneToMany`, `@ManyToOne`) with appropriate `CascadeType`.

### 3. Repository (The Data Access)
- Create interface extending `JpaRepository<Entity, Long>` in `com.mandap.repository`.
- Add custom query methods if needed (`findBy...`).

### 4. DTO (The Contract)
- Use standard classes (or Records if applicable) in `com.mandap.dto`.
- Name them `EntityDTO`.
- Include `Validation` annotations (`@NotBlank`, `@NotNull`).

### 5. Service (The Brains)
- Create Service in `com.mandap.service`.
- Mark with `@Service` and `@Transactional`.
- Implement business logic (Stock checks, permission validation).

### 6. Controller (The Gateway)
- Create Controller in `com.mandap.controller`.
- Use `@RestController` and `@RequestMapping("/api/...")`.
- Wrap all responses in `ResponseEntity<ApiResponse<T>>`.
- Add Security annotations (`@PreAuthorize`).

### 7. Frontend (The Interface)
- Add Model to `core/models`.
- Create Service in `core/services`.
- Create Standalone Component in `features/`.
- Register Route in `app.routes.ts`.

## Checklist
- [ ] Is the migration double-underscored?
- [ ] Is the DTO used in the Controller?
- [ ] Is the API secured with `@PreAuthorize`?
- [ ] Does the UI match the Glassmorphism style?
