// Test script for dayend date logic
const getLocalDateString = (date) => {
  return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
};

// Test with current date
const today = new Date();
console.log('Current date:', today.toISOString());
console.log('Local date string:', getLocalDateString(today));

// Test with specific date
const testDate = new Date('2023-10-29T00:00:00');
console.log('Test date:', testDate.toISOString());
console.log('Local date string:', getLocalDateString(testDate));

// Test parsing date string
const parsedDate = new Date('2023-10-29' + 'T00:00:00');
console.log('Parsed date:', parsedDate.toISOString());
console.log('Local date string:', getLocalDateString(parsedDate));
