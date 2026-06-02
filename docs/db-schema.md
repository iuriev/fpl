# Database Schema

> Auto-maintained alongside `proxy/src/db/schema.ts`.
> **Rule:** any change to `schema.ts` must update this file in the same PR.
> For interactive browsing run `npm run db:studio -w proxy` (Drizzle Studio on `https://local.drizzle.studio`).

## Tables

### `user`

Stores registered user accounts. Extended from better-auth's base schema with `fpl_team_id`.

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| `id` | text | NO | Primary key (better-auth generated) |
| `name` | text | NO | Display name |
| `email` | text | NO | Unique |
| `email_verified` | boolean | NO | Default false |
| `image` | text | YES | Avatar URL |
| `fpl_team_id` | integer | YES | User's saved FPL team ID |
| `created_at` | timestamp | NO | |
| `updated_at` | timestamp | NO | |

### `session`

Active user sessions managed by better-auth.

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| `id` | text | NO | Primary key |
| `expires_at` | timestamp | NO | Session expiry (30 days) |
| `token` | text | NO | Unique session token |
| `created_at` | timestamp | NO | |
| `updated_at` | timestamp | NO | |
| `ip_address` | text | YES | |
| `user_agent` | text | YES | |
| `user_id` | text | NO | FK → `user.id` (cascade delete) |

### `account`

OAuth provider accounts and password credentials, managed by better-auth.

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| `id` | text | NO | Primary key |
| `account_id` | text | NO | Provider's account ID |
| `provider_id` | text | NO | e.g. `google`, `credential` |
| `user_id` | text | NO | FK → `user.id` (cascade delete) |
| `access_token` | text | YES | OAuth access token |
| `refresh_token` | text | YES | OAuth refresh token |
| `id_token` | text | YES | OAuth ID token |
| `access_token_expires_at` | timestamp | YES | |
| `refresh_token_expires_at` | timestamp | YES | |
| `scope` | text | YES | OAuth scopes |
| `password` | text | YES | Argon2id hash (email/password accounts) |
| `created_at` | timestamp | NO | |
| `updated_at` | timestamp | NO | |

### `verification`

Email verification tokens.

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| `id` | text | NO | Primary key |
| `identifier` | text | NO | Email address |
| `value` | text | NO | Verification token |
| `expires_at` | timestamp | NO | |
| `created_at` | timestamp | YES | |
| `updated_at` | timestamp | YES | |

## ER Diagram

```mermaid
erDiagram
    user {
        text id PK
        text name
        text email
        boolean email_verified
        text image
        integer fpl_team_id
        timestamp created_at
        timestamp updated_at
    }
    session {
        text id PK
        timestamp expires_at
        text token
        timestamp created_at
        timestamp updated_at
        text ip_address
        text user_agent
        text user_id FK
    }
    account {
        text id PK
        text account_id
        text provider_id
        text user_id FK
        text access_token
        text refresh_token
        text id_token
        timestamp access_token_expires_at
        timestamp refresh_token_expires_at
        text scope
        text password
        timestamp created_at
        timestamp updated_at
    }
    verification {
        text id PK
        text identifier
        text value
        timestamp expires_at
        timestamp created_at
        timestamp updated_at
    }

    user ||--o{ session : "has"
    user ||--o{ account : "has"
```
