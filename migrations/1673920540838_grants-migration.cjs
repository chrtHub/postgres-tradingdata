/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  //-- role_dev --//
  pgm.grant("role_dev", "SELECT,INSERT,UPDATE,DELETE", "tradingdata02", {
    schema: "public",
  });

  //-- role_app_server_read_write --//
  pgm.grant(
    "role_app_server_read_write",
    "SELECT,INSERT,UPDATE,DELETE",
    "tradingdata02",
    { schema: "public" }
  );

  //-- role_app_server_read_only --//
  pgm.grant("role_app_server_read_only", "SELECT", "tradingdata02", {
    schema: "public",
  });
};

exports.down = (pgm) => {
  //-- role_dev --//
  pgm.revoke("role_dev", "SELECT,INSERT,UPDATE,DELETE", "tradingdata02", {
    schema: "public",
  });

  //-- role_app_server_read_write --//
  pgm.revoke(
    "role_app_server_read_write",
    "SELECT,INSERT,UPDATE,DELETE",
    "tradingdata02",
    { schema: "public" }
  );

  //-- role_app_server_read_only --//
  pgm.revoke("role_app_server_read_only", "SELECT", "tradingdata02", {
    schema: "public",
  });
};
