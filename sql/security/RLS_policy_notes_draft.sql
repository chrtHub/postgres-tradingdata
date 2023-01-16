-- Enable RLS
ALTER TABLE
    tradingdata01 ENABLE ROW LEVEL SECURITY;

-- Force RLS
ALTER TABLE
    tradingdata01 FORCE ROW LEVEL SECURITY;

-- Grant roles??
-- DRAFT
GRANT
SELECT
    ON tradingdata01 TO role_app_server_read_write,
    role_app_server_read_only,
    role_dev;

-- Create policy
-- problem - this needs to be a dynamic value of cognito_sub, not a value of a user in postgres
CREATE POLICY cognito_sub ON tradingdata01 FOR ALL USING (cognito_sub = cognito_sub);

-- DRAFT
-- what's the 'WITH CHECK OPTION' do?
CREATE POLICY tradingdata01_policy ON tradingdata01 FOR ALL USING (cognito_sub = CURRENT_USER) WITH CHECK OPTION;

Do a bunch of this: knex.raw(
    'SET LOCAL "app.current_tenant" = ?',
    ['tenant1']
).then(
    () = > { / / Query with tenant1 context knex.select('*').from('some_table').then(console.log);

}
);