Supabase Vault is a Postgres extension designed for securely storing sensitive information like API keys, access tokens, and other secrets within your database. It was introduced in 2022 and is now available on every Supabase project by default[8].

## Capabilities and Access

Supabase Vault provides:

- Encryption at rest for sensitive data[3]
- A simple interface for storing and retrieving secrets[8]
- Integration with database functions, triggers, and webhooks[4]

You can access Vault through:

1. **SQL queries** - directly from your database functions and triggers[10]
2. **Supabase Client** - using RPC functions like `read_secret`[7]
3. **Edge Functions** - you can access Vault secrets from Supabase Edge Functions, which are globally distributed TypeScript functions for custom business logic[1][2]

## Security Implementation

Vault uses advanced security measures to protect your secrets:

- **Transparent Column Encryption (TCE)** - based on pgsodium and libsodium libraries[3][8]
- **Authenticated Encryption with Associated Data (AEAD)** - ensures data is both encrypted and signed so it cannot be forged[3]
- **External Key Storage** - encryption keys are never stored in the database alongside encrypted data; only key IDs are stored[3]
- **Root Key Management** - Supabase generates and manages a unique per-database root key stored outside of SQL, accessible only internally by the libsodium library[8]

## Usage for Multi-tenant Applications

Vault can be effectively used in multi-tenant applications:

- You can store tenant-specific secrets by incorporating tenant IDs in your secret naming convention[5]
- Combined with custom claims for authentication, you can create a robust multi-tenant system[5]

For example, you could create tenant-specific secrets:
```sql
SELECT vault.create_secret('tenant_api_key', 'tenant_123_api_key', 'API key for tenant 123');
```

## Argon2id Integration

While Vault itself uses libsodium for encryption, Supabase has implemented Argon2id password hashing in their authentication system[9]. You could:

1. Store Argon2id-hashed passwords in Vault for additional protection
2. Use Vault to store configuration parameters for Argon2id (like memory, iterations, parallelism)
3. Implement a custom password vault using Vault to store encrypted password data and Argon2id for the master password

For a multi-tenant password vault using Argon2id, you could:
1. Use Vault to store encrypted tenant-specific secrets
2. Implement Argon2id password hashing in your application code
3. Use Row Level Security (RLS) policies to ensure tenant data isolation

The Vault provides a solid foundation for building secure, multi-tenant applications with proper secret management capabilities.

Citations:
[1] https://supabase.com/docs/guides/getting-started/features
[2] https://tomaspozo.com/articles/secure-api-calls-supabase-pg-net-vault
[3] https://supabase.com/docs/guides/database/vault
[4] https://www.packtpub.com/en-it/product/building-production-grade-web-applications-with-supabase-9781837630684/chapter/chapter-12-avoiding-unwanted-data-manipulation-and-undisclosed-exposures-16/section/benefiting-from-supabase-vault-ch16lvl1sec12
[5] https://www.reddit.com/r/Supabase/comments/165kbqs/is_supabase_capable_of_multi_tenancy/
[6] https://crypto.stackexchange.com/questions/84081/how-to-choose-parameters-for-argon2-for-a-password-vault
[7] https://makerkit.dev/blog/tutorials/supabase-vault
[8] https://supabase.com/blog/supabase-vault
[9] https://github.com/orgs/supabase/discussions/13130
[10] https://github.com/supabase/vault
[11] https://news.ycombinator.com/item?id=32532313
[12] https://www.reddit.com/r/Supabase/comments/1g2nl53/introducing_key_vault_a_secure_way_to_manage_your/
[13] https://supabase.com/blog/vault-now-in-beta
[14] https://www.youtube.com/watch?v=cUlWyYSx7bg
[15] https://www.reddit.com/r/Supabase/comments/1gm7f0p/how_to_use_vault_for_encrypting_patient_data_in/
[16] https://supabase.com/docs/guides/database/functions
[17] https://stackoverflow.com/questions/76415907/how-to-access-a-supabase-vault-secret-from-my-app
[18] https://supabase.com/docs/guides/functions
[19] https://www.reddit.com/r/Supabase/comments/18iacth/supabase_vault_store_thirdparty_api_keys_per_user/
[20] https://github.com/orgs/supabase/discussions/18876
[21] https://supabase.com/features/vault
[22] https://www.reddit.com/r/Supabase/comments/1i1zdzx/storing_secrets_in_edge_functions_secrets_than/
[23] https://supabase.com/docs/guides/functions/schedule-functions
[24] https://community.weweb.io/t/supabase-api-javascript-key-safety/5457
[25] https://supabase.com/docs/guides/database/secure-data
[26] https://www.reddit.com/r/Supabase/comments/1fc6fpl/vault_and_secrets/
[27] https://www.youtube.com/watch?v=QHLPNDrdN2w
[28] https://www.tomaszezula.com/keep-data-safe-in-multi-tenant-systems-a-case-for-supabase-and-row-level-security/
[29] https://lib.rs/authentication
[30] https://github.com/sqlalchemy/sqlalchemy/discussions/12185
[31] https://s3.jcloud.sjtu.edu.cn/899a892efef34b1b944a19981040f55b-oss01/crates.io/crates/mirror_clone_list.html
[32] https://www.antstack.com/blog/multi-tenant-applications-with-rls-on-supabase-postgress/
[33] https://www.reddit.com/r/golang/comments/c5ks8j/storing_argon2_hashed_passwords_to_postgres/
[34] https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac
[35] https://www.reddit.com/r/Bitwarden/comments/16cfetj/is_it_safe_to_store_totp_keys_in_bitwarden/
[36] https://supabase.com/docs/guides/database/postgres/row-level-security
[37] https://supabase.com/docs/guides/auth/password-security
[38] https://github.com/orgs/supabase/discussions/6321
[39] https://stackoverflow.com/questions/78900191/manage-edge-functions-in-a-multi-environment-development-setup-using-webhooks-on
[40] https://supabase.com/blog/supabase-dynamic-functions
[41] https://news.ycombinator.com/item?id=34015167
[42] https://community.bitwarden.com/t/pbkdf2-vs-argon2-which-is-better/59187
[43] https://www.youtube.com/watch?v=ZKggtU4InrM

---
Answer from Perplexity: pplx.ai/share