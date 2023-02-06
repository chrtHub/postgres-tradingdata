/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable("tradingdata02", {
    uuid: {
      type: "uuid",
      primaryKey: true,
    },
    cognito_sub: {
      type: "varchar(64)",
      notNull: true,
    },
    brokerage: {
      type: "varchar(64)",
    },
    filename: {
      type: "varchar(256)",
      notNull: true,
    },
    import_timestamp: {
      type: "numeric",
      notNull: true,
    },
    import_uuid: {
      type: "varchar(64)",
      notNull: true,
    },
    trade_uuid: {
      type: "varchar(64)",
      notNull: true,
    },
    account: {
      type: "varchar(64)",
    },
    trade_date: {
      type: "date",
      notNull: true,
    },
    settlement_date: {
      type: "date",
    },
    currency: {
      type: "varchar(8)",
    },
    trade_type: {
      type: "varchar(8)",
    },
    side: {
      type: "varchar(8)",
      notNull: true,
    },
    symbol: {
      type: "varchar(16)",
      notNull: true,
    },
    quantity: {
      type: "numeric",
      notNull: true,
    },
    price: {
      type: "numeric",
      notNull: true,
    },
    execution_time: {
      type: "time",
      notNull: true,
    },
    commission: {
      type: "numeric",
    },
    fees: {
      type: "numeric",
    },
    gross_proceeds: {
      type: "numeric",
    },
    net_proceeds: {
      type: "numeric",
    },
    clearing_broker: {
      type: "varchar(16)",
    },
    liq: {
      type: "varchar(16)",
    },
    note: {
      type: "text",
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable("tradingdata02");
};
