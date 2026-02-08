'use strict';

module.exports = {
  up: function (db) {
    // Add the kitchenmaingroupid column to mstkitchencategory table
    db.exec(`
      ALTER TABLE mstkitchencategory ADD COLUMN kitchenmaingroupid INTEGER;
    `);
  },

  down: function (db) {
    // Remove the kitchenmaingroupid column from mstkitchencategory table
    db.exec(`
      ALTER TABLE mstkitchencategory DROP COLUMN kitchenmaingroupid;
    `);
  }
};
