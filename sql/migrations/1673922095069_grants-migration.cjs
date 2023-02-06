/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  //-- role_dev --//
  pgm.sql(
    `GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE tradingdata02 TO role_dev`
  );

  //-- role_app_server_read_write --//
  pgm.sql(
    `GRANT SELECT, INSERT ON TABLE tradingdata02 TO role_app_server_read_write`
  );

  //-- role_app_server_read_only --//
  pgm.sql(`GRANT SELECT ON TABLE tradingdata02 TO role_app_server_read_only`);
};

exports.down = (pgm) => {
  //-- role_dev --//
  pgm.sql(
    `REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE tradingdata02 FROM role_dev`
  );

  //-- role_app_server_read_write --//
  pgm.sql(
    `REVOKE SELECT, INSERT ON TABLE tradingdata02 FROM role_app_server_read_write`
  );

  //-- role_app_server_read_only --//
  pgm.sql(
    `REVOKE SELECT ON TABLE tradingdata02 FROM role_app_server_read_only`
  );
};
