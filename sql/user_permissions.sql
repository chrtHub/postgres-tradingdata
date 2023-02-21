-- View permissions per user-table
SELECT
    grantee,
    table_schema,
    table_name,
    privilege_type
FROM
    information_schema.role_table_grants
WHERE
    grantee = 'role_dev'
    AND table_name = 'tradingdata01';

-- View permissions per user-schema (for multiple users)
SELECT
    grantee,
    table_schema,
    table_name,
    privilege_type
FROM
    information_schema.role_table_grants
WHERE
    grantee IN (
        'postgres',
        'role_dev',
        'role_app_server_read_only',
        'role_app_server_read_write'
    )
    AND table_name = 'tradingdata01';

-- View permissions per user-schema
SELECT
    grantor,
    grantee,
    table_schema,
    table_name,
    privilege_type
FROM
    information_schema.table_privileges
WHERE
    grantee = 'app_server_read_write';

-- Check 'public' roles schema privileges on 'public' schema
WITH "names"("name") AS (
    SELECT
        n.nspname AS "name"
    FROM
        pg_catalog.pg_namespace n
    WHERE
        n.nspname !~ '^pg_'
        AND n.nspname <> 'information_schema'
)
SELECT
    "name",
    pg_catalog.has_schema_privilege(current_user, "name", 'CREATE') AS "create",
    pg_catalog.has_schema_privilege(current_user, "name", 'USAGE') AS "usage"
FROM
    "names";

-- Roles and privileges on schemas ownership
SELECT
    nspname as schema_name,
    rolname as grantee,
    has_schema_privilege(rolname, nspname, 'USAGE') as usage,
    has_schema_privilege(rolname, nspname, 'CREATE') as create
FROM
    pg_namespace n
    JOIN pg_roles r ON (r.oid = n.nspowner)