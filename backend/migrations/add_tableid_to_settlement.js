const db = require('../config/db');

async function migrate() {
  try {
    console.log('🚀 Starting TrnSettlement tableid migration...');

    // 1. Check if tableid column exists
    const [columns] = await db.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'TrnSettlement' 
      AND TABLE_SCHEMA = DATABASE()
      AND COLUMN_NAME = 'tableid'
    `);

    if (columns.length > 0) {
      console.log('✅ tableid column already exists. Skipping...');
      return;
    }

    // 2. Add tableid column
    await db.query('ALTER TABLE TrnSettlement ADD COLUMN tableid INT AFTER table_name');
    console.log('✅ Added tableid column to TrnSettlement');

    // 3. Populate tableid for existing records
    const [updatedRows] = await db.query(`
      UPDATE TrnSettlement s
      JOIN msttablemanagement t ON s.table_name = t.table_name
      SET s.tableid = t.tableid
      WHERE s.tableid IS NULL AND s.table_name IS NOT NULL
    `);
    
    console.log(`✅ Updated ${updatedRows.affectedRows} settlement records with tableid`);

    // 4. Add foreign key constraint (optional, with error handling)
    try {
      await db.query(`
        ALTER TABLE TrnSettlement 
        ADD CONSTRAINT fk_settlement_table 
        FOREIGN KEY (tableid) REFERENCES msttablemanagement(tableid)
        ON DELETE SET NULL
      `);
      console.log('✅ Added foreign key constraint');
    } catch (fkError) {
      console.log('⚠️  Foreign key constraint skipped (tables may have mismatches)');
    }

    // 5. Verify results
    const [verification] = await db.query(`
      SELECT 
        COUNT(*) as total_settlements,
        COUNT(tableid) as with_tableid,
        COUNT(table_name) as with_tablename
      FROM TrnSettlement
    `);
    
    console.log('📊 Migration verification:', verification[0]);
    console.log('🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

migrate();

