/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`ALTER TABLE tradingdata02 RENAME COLUMN cognito_sub TO user_db_id`);
};

exports.down = (pgm) => {
  pgm.sql(`ALTER TABLE tradingdata02 RENAME COLUMN user_db_id TO cognito_sub`);
};
