CREATE TABLE IF NOT EXISTS Users (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_firstname TEXT NOT NULL,
        user_lastname TEXT NOT NULL,
        user_email TEXT NOT NULL UNIQUE,
        user_phonenumber TEXT NOT NULL UNIQUE,
        user_password TEXT NOT NULL
    );
CREATE TABLE IF NOT EXISTS transactions (
    transactionId INTEGER PRIMARY KEY AUTOINCREMENT,
    amount REAL NOT NULL,
    description TEXT NOT NULL,
    date DATE NOT NULL,
    user_id INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES Users(user_id)
    );
INSERT INTO Transactions (amount, description, date, User_id) VALUES (100.00, 'Deposit', '2023-01-01', 1);
ALTER TABLE transactions RENAME TO Budget_old;
CREATE TABLE Transactions (
    Transaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount REAL NOT NULL,
    description TEXT NOT NULL,
    date DATE NOT NULL);
DROP TABLE Budget_old;


INSERT INTO Users (user_firstname, user_lastname, user_email, user_phonenumber, user_password)
    VALUES
        ("Test", "Test", "Test@gmail.com", "3332224444","Test");

CREATE TABLE IF NOT EXISTS Budget(
    budgetId INTEGER PRIMARY KEY AUTOINCREMENT,
    budget_amount REAL NOT NULL,
    budget_description TEXT NOT NULL,
    user_id INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES Users(user_id)
);

INSERT INTO Transactions (amount, description, date) VALUES (100.00, 'Deposit', '2023-01-01');
CREATE INDEX idx_user_id ON Budget (user_id);