SELECT
    uuid,
    brokerage,
    filename,
    import_timestamp,
    import_uuid,
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
    trade_uuid = '8473577b-8347-48e6-a7ec-1b3817b696ee'
ORDER BY
    execution_time ASC;

-- '8473577b-8347-48e6-a7ec-1b3817b696ee'
-- 'fe9d58fc-0cd0-4b49-876e-651bf7d0242c'
-- '1af8f550-8e49-4efe-9376-cd8ee9e1cc84'
-- '88c6bbc1-3568-4fea-9622-ae22194622a1'
-- '891f043c-7376-4e72-94c0-8e974384d9ee'
-- 'd8c36f2c-ffeb-4ebd-bb60-669069be6347'
-- 'e65d62cc-66f0-406c-95f0-5a48d446e29a'