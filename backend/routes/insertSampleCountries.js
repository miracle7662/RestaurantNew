const db = require('./config/db');

// Sample countries data
const countries = [
  { country_name: 'India', country_code: 'IN', country_capital: 'New Delhi', status: 1 },
  { country_name: 'United States', country_code: 'US', country_capital: 'Washington, D.C.', status: 1 },
  { country_name: 'United Kingdom', country_code: 'GB', country_capital: 'London', status: 1 },
  { country_name: 'Canada', country_code: 'CA', country_capital: 'Ottawa', status: 1 },
  { country_name: 'Australia', country_code: 'AU', country_capital: 'Canberra', status: 1 },
  { country_name: 'Germany', country_code: 'DE', country_capital: 'Berlin', status: 1 },
  { country_name: 'France', country_code: 'FR', country_capital: 'Paris', status: 1 },
  { country_name: 'Japan', country_code: 'JP', country_capital: 'Tokyo', status: 1 },
  { country_name: 'China', country_code: 'CN', country_capital: 'Beijing', status: 1 },
  { country_name: 'Brazil', country_code: 'BR', country_capital: 'Brasília', status: 1 },
  { country_name: 'Singapore', country_code: 'SG', country_capital: 'Singapore', status: 1 },
  { country_name: 'United Arab Emirates', country_code: 'AE', country_capital: 'Abu Dhabi', status: 1 },
  { country_name: 'Saudi Arabia', country_code: 'SA', country_capital: 'Riyadh', status: 1 },
  { country_name: 'South Korea', country_code: 'KR', country_capital: 'Seoul', status: 1 },
  { country_name: 'Netherlands', country_code: 'NL', country_capital: 'Amsterdam', status: 1 }
];

// Insert countries
const insertCountries = () => {
  try {
    console.log('Inserting sample countries...');
    
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO mstcountrymaster 
      (country_name, country_code, country_capital, status, created_by_id, created_date) 
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    countries.forEach(country => {
      stmt.run(
        country.country_name,
        country.country_code,
        country.country_capital,
        country.status,
        1, // created_by_id (SuperAdmin)
        new Date().toISOString()
      );
    });
    
    console.log('Sample countries inserted successfully!');
    
    // Display inserted countries
    const insertedCountries = db.prepare('SELECT * FROM mstcountrymaster').all();
    console.log('Total countries in database:', insertedCountries.length);
    console.log('Sample countries:', insertedCountries.slice(0, 5));
    
  } catch (error) {
    console.error('Error inserting countries:', error);
  }
};

// Run the script
insertCountries(); 