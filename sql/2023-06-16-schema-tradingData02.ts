let schema = {
  uuid: uuidv4(),
  // "type": "uuid",
  // "primaryKey": true
  user_db_id: user_db_id,
  // "type": "varchar(64)",
  // "notNull": true
  brokerage: brokerage,
  // "type": "varchar(64)"
  filename: filename, // NEW
  // "type": "varchar(256)",
  // "notNull": true
  import_timestamp: import_timestamp,
  // "type": "numeric",
  // "notNull": true
  file_uuid: file_uuid, // NEW
  // "type": "varchar(64)",
  // "notNull": true
  trade_uuid: trade_uuid,
  // "type": "varchar(64)",
  // "notNull": true
  account: null,
  // "type": "varchar(64)"
  trade_date: trade_date,
  // "type": "date",
  // "notNull": true
  settlement_date: null,
  // "type": "date"
  currency: currency,
  // "type": "varchar(8)"
  trade_type: trade_type,
  // "type": "varchar(8)"
  side: side,
  // "type": "varchar(8)",
  // "notNull": true
  symbol: symbol,
  // "type": "varchar(16)",
  // "notNull": true
  quantity: qty,
  // "type": "numeric",
  // "notNull": true
  price: price,
  // "type": "numeric",
  // "notNull": true
  execution_time: execution_time,
  // "type": "time",
  // "notNull": true
  commission: null,
  // "type": "numeric"
  fees: fees,
  // "type": "numeric"
  gross_proceeds: gross_proceeds,
  // "type": "numeric"
  net_proceeds: net_proceeds,
  // "type": "numeric"
  clearing_broker: null,
  // "type": "varchar(16)"
  liq: null,
  // "type": "varchar(16)"
  note: null,
  // "type": "text"
};
