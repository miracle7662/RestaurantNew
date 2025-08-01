const db = require('./config/db');
const bcrypt = require('bcrypt');

async function resetSuperAdminPassword() {
    try {
        console.log('🔧 Resetting SuperAdmin password...');
        
        // Create new hashed password
        const newPassword = 'superadmin123';
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Update SuperAdmin password
        const stmt = db.prepare('UPDATE mst_users SET password = ? WHERE email = ?');
        const result = stmt.run(hashedPassword, 'superadmin@miracle.com');
        
        if (result.changes > 0) {
            console.log('✅ SuperAdmin password updated successfully!');
            console.log('   Email: superadmin@miracle.com');
            console.log('   Password: superadmin123');
            
            // Test the new password
            console.log('\n🔐 Testing new password...');
            const user = db.prepare('SELECT password FROM mst_users WHERE email = ?').get('superadmin@miracle.com');
            
            if (user) {
                const isValidPassword = await bcrypt.compare(newPassword, user.password);
                if (isValidPassword) {
                    console.log('✅ Password verification successful!');
                    console.log('   You can now login with:');
                    console.log('   Email: superadmin@miracle.com');
                    console.log('   Password: superadmin123');
                } else {
                    console.log('❌ Password verification still failed');
                }
            }
        } else {
            console.log('❌ No SuperAdmin user found to update');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

// Run the reset
resetSuperAdminPassword(); 