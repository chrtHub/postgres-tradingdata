/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`GRANT SELECT ON TABLE pgmigrations TO role_dev`);
};

exports.down = (pgm) => {
  pgm.sql(`REVOKE SELECT ON TABLE pgmigrations FROM role_dev`);
};
