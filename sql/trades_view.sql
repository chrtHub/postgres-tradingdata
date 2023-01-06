--// create trades view //--
CREATE VIEW trades_view AS (
    SELECT
);

--// queries for trades view //--
SELECT
    SUM(quantity) as sum_quantity,
    SUM(net_proceeds) as sum_net_proceeds,
    SUM(quantity * price) as sum_quantity_times_price,
FROM
    trades_view
GROUP BY
    side;