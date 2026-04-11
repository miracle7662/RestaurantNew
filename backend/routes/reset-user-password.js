const db = require('../config/db');
const bcrypt = require('bcrypt');

async function resetUserPassword() {
  try {
    console.log('🔧 Fixing superadmin password...');
    
    // User details from task
    const email = 'admin@miracleinfotech.org';
    const plainPassword = 'admin123';
    
    // Hash password
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    
    // Ensure status=0 and update password
    const stmt = db.prepare(`
      UPDATE mst_users 
      SET password = ?, status = 0 
      WHERE email = ?
    `);
    
    const result = stmt.run(hashedPassword, email);
    
    if (result.changes > 0) {
      console.log('✅ Password updated & status set to active');
      
      // Verify
      const user = db.get(`SELECT userid, username, email, status, role_level FROM mst_users WHERE email = ?`, [email]);
      console.log('Updated user:', JSON.stringify(user, null, 2));
      
      const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
      console.log('Password hash verification:', isMatch);
      
      console.log('\n🔐 Login credentials:');
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${plainPassword}`);
      
    } else {
      console.log('❌ No user found with email:', email);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

resetUserPassword();

