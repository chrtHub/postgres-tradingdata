--// get list of trade_uuid values by date //--
SELECT
    DISTINCT import_uuid,
    import_timestamp
FROM
    tradingdata01
WHERE
    trade_date = '2021-08-04';

--// Delete import by import_uuid //--
DELETE FROM
    table_name
WHERE
    import_uuid = 'some_imoprpt_uuid';