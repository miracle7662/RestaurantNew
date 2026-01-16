module.exports = {
  up: (db) => {
    return db.prepare(`
      CREATE TABLE IF NOT EXISTS TrnSettlementLog (
        ID INTEGER PRIMARY KEY AUTOINCREMENT,
        SettlementID INTEGER NOT NULL,
        OldPaymentType TEXT,
        OldAmount REAL,
        NewPaymentType TEXT,
        NewAmount REAL,
        EditedBy TEXT,
        InsertDate DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (SettlementID) REFERENCES TrnSettlement(SettlementID) ON DELETE CASCADE
      )
    `).run();
  },

  down: (db) => {
    return db.prepare("DROP TABLE IF EXISTS TrnSettlementLog").run();
  }
};
