const formatMySQLDate = (dateInput) => {
  if (!dateInput) {
    return new Date().toISOString().slice(0, 19).replace('T', ' ');
  }
  
  let date;
  if (typeof dateInput === 'string') {
    date = new Date(dateInput);
  } else if (dateInput instanceof Date) {
    date = dateInput;
  } else {
    return new Date().toISOString().slice(0, 19).replace('T', ' ');
  }
  
  if (isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 19).replace('T', ' ');
  }
  
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

module.exports = { formatMySQLDate };
