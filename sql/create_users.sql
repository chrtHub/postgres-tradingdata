-- Dev User
CREATE ROLE dev LOGIN PASSWORD 'some_password';

GRANT CONNECT ON DATABASE chrtUserTradingData TO dev;

GRANT USAGE,
CREATE ON SCHEMA public TO dev;

GRANT
SELECT
,
INSERT
,
UPDATE
,
    DELETE,
    TRUNCATE,
    REFERENCES,
    TRIGGER ON ALL TABLES IN SCHEMA public TO dev;

-- Server read-only User
CREATE ROLE app_server_read_only LOGIN PASSWORD 'some_password';

GRANT CONNECT ON DATABASE chrtUserTradingData TO app_server_read_only;

GRANT USAGE,
SELECT
    ON SCHEMA public TO app_server_read_only;

GRANT
SELECT
    ON ALL TABLES IN SCHEMA public TO app_server_read_only;

-- Server read and write User
CREATE ROLE app_server_read_write;