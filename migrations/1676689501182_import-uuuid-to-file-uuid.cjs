/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.renameColumn("tradingdata02", "import_uuid", "file_uuid");
};

exports.down = (pgm) => {
  pgm.renameColumn("tradingdata02", "file_uuid", "import_uuid");
};
