--// Common Table Expression for trade //--
WITH trade AS (
    SELECT
        trade_uuid,
        trade_date,
        side,
        symbol,
        quantity,
        price,
        execution_time,
        net_proceeds
    FROM
        tradingdata01
    WHERE
        trade_uuid = '1af8f550-8e49-4efe-9376-cd8ee9e1cc84' -- AND cognito_sub = 'some_cognito_sub' -- where to have this for query speed + data security? 
)
SELECT
    trade_uuid,
    trade_date,
    symbol,
    side,
    -- -- -- -- -- 
    -- first_execution_time
    MIN(execution_time) AS first_execution_time,
    -- -- -- -- -- 
    -- last_execution_time
    MAX(execution_time) AS last_execution_time,
    -- -- -- -- -- 
    -- quantity_bought
    SUM(quantity) AS quantity,
    -- -- -- -- -- 
    -- quantity_times_price
    SUM(quantity * price) AS quantity_times_price,
    -- -- -- -- -- 
    -- net_proceeds
    SUM(net_proceeds) AS net_proceeds
FROM
    trade
GROUP BY
    trade_uuid,
    trade_date,
    symbol,
    side;