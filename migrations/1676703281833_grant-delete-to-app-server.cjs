/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = function (pgm) {
  pgm.sql("GRANT DELETE ON tradingdata02 TO role_app_server_read_write;");
};

exports.down = function (pgm) {
  pgm.sql("REVOKE DELETE ON tradingdata02 FROM role_app_server_read_write;");
};
