-- (DRAFT, has not been used)
--
CREATE POLICY rls_policy ON tradingdata01 USING ();

--
CREATE POLICY rls_policy_cognito_sub ON tradingdata01 USING (cognito_sub = 'CURRENT_USER');

GRANT
SELECT
    ON tradingdata01 TO public;

--
CREATE POLICY tradingdata01_policy ON tradingdata01 FOR ALL USING (cognito_sub = CURRENT_USER) WITH CHECK OPTION;