---
name: db-migrator
description: playbook for creating Flyway migrations correctly.
---

# DB Migration Skill

## Purpose
Ensure all database changes are versioned, repeatable, and safe for production data.

## Process
1. **Identify the Change**: Is it a new table, a column addition, or a data seed?
2. **Check Current Version**: Look in `src/main/resources/db/migration/`. If the last file starts with `V11`, your new file must start with `V12`.
3. **Create the File**: `V{N}__short_description.sql` (Note the double underscore!).
4. **Write the SQL**:
   - Use standard MySQL 8 syntax.
   - For new tables, include `ENGINE=InnoDB`.
   - For auditing, remember to create the corresponding `_aud` table for Hibernate Envers.
5. **Verify Entities**: Update the corresponding Java `@Entity` class to match the SQL exactly.

## Example: Adding a Column
File: `V12__add_discount_to_bill.sql`
```sql
ALTER TABLE bills ADD COLUMN seasonal_discount DECIMAL(12,2) DEFAULT 0.00;
```

## Example: New Audit Table
If adding a table `events`, create `events` and `events_aud`.

## Anti-Patterns
- ❌ **NEVER** modify an existing migration file that has already been committed/deployed.
- ❌ **NEVER** use `ddl-auto=update` to generate your schema.
- ❌ **NEVER** skip the audit tables if the entity is marked as `@Audited`.
