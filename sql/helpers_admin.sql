--// "get a list of all the database users and roles along with a list of roles that have been granted to them" //--
SELECT
    r.rolname,
    ARRAY(
        SELECT
            b.rolname
        FROM
            pg_catalog.pg_auth_members m
            JOIN pg_catalog.pg_roles b ON (m.roleid = b.oid)
        WHERE
            m.member = r.oid
    ) as memberof
FROM
    pg_catalog.pg_roles r
WHERE
    r.rolname NOT IN (
        'pg_signal_backend',
        'rds_iam',
        'rds_replication',
        'rds_superuser',
        'rdsadmin',
        'rdsrepladmin'
    )
ORDER BY
    1;