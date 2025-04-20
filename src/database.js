import sqlite3 from 'sqlite3';

// Open database
const db = new sqlite3.Database('../db/database.db', sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite3 database.');
  }
});

// Export db instance
export default db;
