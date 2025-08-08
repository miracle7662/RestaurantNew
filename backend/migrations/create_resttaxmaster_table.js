const db = require('../config/db');

async function createRestTaxMasterTable() {
    try {
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS mst_resttaxmaster (
                resttaxid INTEGER PRIMARY KEY AUTOINCREMENT,
                hotelid INTEGER NOT NULL,
                outletid INTEGER,
                isapplicablealloutlet INTEGER DEFAULT 0,
                resttax_name TEXT NOT NULL,
                resttax_value TEXT NOT NULL,
                restcgst TEXT,
                restsgst TEXT,
                restigst TEXT,
                taxgroupid INTEGER,
                status INTEGER DEFAULT 1,
                created_by_id INTEGER,
                created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_by_id INTEGER,
                updated_date DATETIME,
                FOREIGN KEY (hotelid) REFERENCES HotelMasters(hotelid) ON DELETE CASCADE,
                FOREIGN KEY (outletid) REFERENCES outlets(outletid) ON DELETE SET NULL,
                FOREIGN KEY (taxgroupid) REFERENCES mst_taxgroup(taxgroupid) ON DELETE SET NULL
            )
        `;

        await db.execute(createTableQuery);
        console.log('✅ mst_resttaxmaster table created successfully');

        // Create indexes for better performance
        const createIndexes = [
            'CREATE INDEX IF NOT EXISTS idx_resttax_hotel ON mst_resttaxmaster(hotelid)',
            'CREATE INDEX IF NOT EXISTS idx_resttax_outlet ON mst_resttaxmaster(outletid)',
            'CREATE INDEX IF NOT EXISTS idx_resttax_status ON mst_resttaxmaster(status)',
            'CREATE INDEX IF NOT EXISTS idx_resttax_name ON mst_resttaxmaster(resttax_name)'
        ];

        for (const indexQuery of createIndexes) {
            await db.execute(indexQuery);
        }
        console.log('✅ Indexes created successfully');

    } catch (error) {
        console.error('❌ Error creating mst_resttaxmaster table:', error);
        throw error;
    }
}

// Run the migration if this file is executed directly
if (require.main === module) {
    createRestTaxMasterTable()
        .then(() => {
            console.log('Migration completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Migration failed:', error);
            process.exit(1);
        });
}

module.exports = { createRestTaxMasterTable };
