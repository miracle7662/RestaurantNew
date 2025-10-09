module.exports = {
  up: (db) => {
    return db.prepare("CREATE TABLE IF NOT EXISTS TrnSettlementPaymentTypes (" +
      "ID INTEGER PRIMARY KEY AUTOINCREMENT," +
      "SettlementID INTEGER NOT NULL," +
      "PaymentType TEXT NOT NULL," +
      "Amount REAL DEFAULT 0," +
      "FOREIGN KEY (SettlementID) REFERENCES TrnSettlement(SettlementID) ON DELETE CASCADE" +
      ")").run();
  },

  down: (db) => {
    return db.prepare("DROP TABLE IF EXISTS TrnSettlementPaymentTypes").run();
  }
};
