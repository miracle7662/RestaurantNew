const db = require('../config/db');

async function createTrnDayendTable() {
    try {
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS trn_dayend (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                business_date DATE NOT NULL,
                lock_time TIME NOT NULL,
                total_amount DECIMAL(10,2) NOT NULL,
                outlet_id INTEGER NOT NULL,
                hotel_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (outlet_id) REFERENCES outlets(outletid) ON DELETE CASCADE,
                FOREIGN KEY (hotel_id) REFERENCES HotelMasters(hotelid) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES mst_users(userid) ON DELETE CASCADE
            )
        `;

        await db.execute(createTableQuery);
        console.log('✅ trn_dayend table created successfully');

        // Create indexes for better performance
        const createIndexes = [
            'CREATE INDEX IF NOT EXISTS idx_dayend_business_date ON trn_dayend(business_date)',
            'CREATE INDEX IF NOT EXISTS idx_dayend_outlet ON trn_dayend(outlet_id)',
            'CREATE INDEX IF NOT EXISTS idx_dayend_hotel ON trn_dayend(hotel_id)',
            'CREATE INDEX IF NOT EXISTS idx_dayend_user ON trn_dayend(user_id)'
        ];

        for (const indexQuery of createIndexes) {
            await db.execute(indexQuery);
        }
        console.log('✅ Indexes created successfully');

    } catch (error) {
        console.error('❌ Error creating trn_dayend table:', error);
        throw error;
    }
}

