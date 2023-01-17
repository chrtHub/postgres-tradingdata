/* eslint-disable camelcase */

exports.shorthands = undefined;

// raw SQL doesn't provide any SQL validation from node-pg-migrate
// exports.up = (pgm) => {
//   pgm.sql(`
//   CREATE TABLE tradingdata02 (
//     uuid uuid PRIMARY KEY,
//     cognito_sub varchar(64) NOT NULL,
//     brokerage varchar(64),
//     filename varchar(256) NOT NULL,
//     import_timestamp numeric NOT NULL,
//     import_uuid varchar(64) NOT NULL,
//     trade_uuid varchar(64) NOT NULL,
//     account varchar(64),
//     trade_date date NOT NULL,
//     settlement_date date,
//     currency varchar(8),
//     -- type is market or limit? long or short?
//     trade_type varchar(8),
//     side varchar(8) NOT NULL,
//     symbol varchar(16) NOT NULL,
//     quantity numeric NOT NULL,
//     price numeric NOT NULL,
//     execution_time time NOT NULL,
//     commission numeric,
//     fees numeric,
//     gross_proceeds numeric,
//     net_proceeds numeric,
//     clearing_broker varchar(16),
//     liq varchar(16),
//     note text,
//   );
//   `);
// };

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

// exports.down = (pgm) => {
//   pgm.sql("DROP TABLE tradingdata02;");
// };

exports.down = (pgm) => {
  pgm.dropTable("tradingdata02");
};
