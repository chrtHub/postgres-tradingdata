--https://aws.amazon.com/blogs/database/managing-postgresql-users-and-roles/
--// Example read/write role //--
--create role
CREATE ROLE readwrite;

-- connect to db
GRANT CONNECT ON DATABASE mydatabase TO readwrite;

-- option a - schema usage, no object creation
GRANT USAGE ON SCHEMA myschema TO readwrite;

-- option b - schema usage and object creation
GRANT USAGE,
CREATE ON SCHEMA myschema TO readwrite;

-- option a - access to run commands on individual tables in schema
GRANT
SELECT
,
INSERT
,
UPDATE
,
    DELETE ON TABLE mytable1,
    mytable2 TO readwrite;

-- option b - access to run commands on all tables in schema
GRANT
SELECT
,
INSERT
,
UPDATE
,
    DELETE ON ALL TABLES IN SCHEMA myschema TO readwrite;

--// Some other example commands are listed in the article //--