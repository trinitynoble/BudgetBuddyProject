CREATE TABLE IF NOT EXISTS Users (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_firstname TEXT NOT NULL,
        user_lastname TEXT NOT NULL,
        user_email TEXT NOT NULL UNIQUE,
        user_phonenumber TEXT NOT NULL UNIQUE,
        user_password TEXT NOT NULL
    );
CREATE TABLE Transactions (
    transactionId INTEGER PRIMARY KEY AUTOINCREMENT,
    amount REAL NOT NULL,
    description TEXT NOT NULL,
    date DATE NOT NULL,
    User_id INTEGER NOT NULL,
        FOREIGN KEY (User_id) REFERENCES Users(User_id)
    );
INSERT INTO Transactions (amount, description, date, User_id) VALUES (100.00, 'Deposit', '2023-01-01', 1);
ALTER TABLE Transactions RENAME TO Transactions_old;
CREATE TABLE Transactions (
    Transaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount REAL NOT NULL,
    description TEXT NOT NULL,
    date DATE NOT NULL);
DROP TABLE Transactions_old;

INSERT INTO Users (user_firstname, user_lastname, user_email, user_phonenumber, user_password)
    VALUES
        ("Test", "Test", "Test@gmail.com", "3332224444","Test");

INSERT INTO Transactions (amount, description, date) VALUES (100.00, 'Deposit', '2023-01-01');
