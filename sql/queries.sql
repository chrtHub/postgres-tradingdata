--// ***** ***** ***** ***** ***** //--
--// INTRADAY //--
--// list of txns for a ticker on date //--
SELECT
    *
FROM
    tradingdata01
WHERE
    symbol = 'BTBT'
    AND trade_date = '2021-08-04';

--// net proceeds per side for a ticker on date //--
SELECT
    side,
    trade_date,
    SUM(net_proceeds)
FROM
    tradingdata01
WHERE
    symbol = 'BTBT'
    AND trade_date BETWEEN '2021-08-04'
    AND '2021-08-04'
GROUP BY
    side,
    trade_date
ORDER BY
    trade_date DESC,
    side;

-- knex
--   .select('side', 'trade_date', knex.raw('SUM(net_proceeds)'))
--   .from('tradingdata01')
--   .where('symbol', 'BTBT')
--   .andWhere('trade_date', '>=', '2021-08-01')
--   .andWhere('trade_date', '<=', '2021-09-01')
--   .groupBy('side', 'trade_date')
--   .orderBy('trade_date', 'desc')
--   .orderBy('side');
--// net proceeds, quantity, quantity per side per ticker for a given date //--
-- DRAFTs
SELECT
    symbol,
    side,
    trade_date,
    SUM(net_proceeds) as pl,
    SUM(quantity) as volume
FROM
    tradingdata01
WHERE
    trade_date BETWEEN '2021-08-04'
    AND '2021-08-04'
GROUP BY
    symbol,
    side,
    trade_date
ORDER BY
    trade_date DESC,
    symbol,
    side;

--// total profit or loss for a particular date //--
-- DRAFT
SELECT
    SUM(sides.net_proceeds)
FROM
    (
        SELECT
            SUM (net_proceeds) as net_proceeds
        FROM
            tradingdata01
        WHERE
            trade_date BETWEEN '2021-08-04'
            AND '2021-08-04'
        GROUP BY
            side
    ) as sides;

--// profit or loss for a ticker on a date //--
-- DRAFT
SELECT
    SUM(sides.net_proceeds)
FROM
    (
        SELECT
            quantity,
            price,
            net_proceeds,
            side
        FROM
            tradingdata01
        WHERE
            symbol = 'BTBT'
            AND trade_date BETWEEN '2021-08-04'
            AND '2021-08-04'
        GROUP BY
            side
    ) as sides;

SELECT
    uuid,
    symbol,
    quantity,
    price,
    (quantity * price) as q_time_p,
    net_proceeds,
    side
FROM
    tradingdata01
WHERE
    symbol = 'BTBT'
    AND trade_date BETWEEN '2021-08-04'
    AND '2021-08-04'
GROUP BY
    side;

--// MULTIDAY //--
--// total profit_loss //--
--// profit_loss for time range //--
--// shares traded by day of week //--
--// profit_loss by day of week //--
-- OTHER
--// ***** ***** ***** ***** ***** //--
--// total price buy and sell for particular ticker during time range //--
SELECT
    SUM(quantity * price),
    side
FROM
    tradingdata01
WHERE
    symbol = 'BTBT'
    AND trade_date BETWEEN '2021-08-01'
    AND '2021-09-01'
GROUP BY
    side;

--// ***** ***** ***** ***** ***** //--
--// 10 highest quantity symbols //--
SELECT
    symbol,
    SUM(quantity)
FROM
    tradingdata01
GROUP BY
    symbol
ORDER BY
    SUM(quantity) DESC
LIMIT
    10;

--// ***** ***** ***** ***** ***** //--
--// 10 highest quantity symbol-dates //--
SELECT
    symbol,
    SUM(quantity),
    trade_date
FROM
    tradingdata01
GROUP BY
    symbol,
    trade_date
ORDER BY
    SUM(quantity) DESC
LIMIT
    10;

--// ***** ***** ***** ***** ***** //--
--// 10 highest quantity trades //--
SELECT
    *
FROM
    tradingdata01
ORDER BY
    quantity DESC
LIMIT
    10;

--// ***** ***** ***** ***** ***** //--
--// 10 highest quantity trade days for a particular symbol //--
SELECT
    trade_date,
    side,
    SUM(quantity)
FROM
    tradingdata01
WHERE
    symbol = 'BTBT'
GROUP BY
    trade_date,
    side
ORDER BY
    SUM(quantity) DESC;

--// ***** ***** ***** ***** ***** //--
--// ***** ***** ***** ***** ***** //--
--// ***** ***** ***** ***** ***** //--
--// Delete all data from a particular import //--
DELETE FROM
    tradingdata01
WHERE
    import_uuid = '"35894348-b852-48fc-9666-269593b16626"';

--// ***** ***** ***** ***** ***** //--
--// Delete all data for multiple imports //--
DELETE FROM
    tradingdata01
WHERE
    import_uuid IN (
        '35894348-b852-48fc-9666-269593b16626',
    )