import request from 'supertest';
import express from 'express';
import transactionRoutes from '../src/api/trans.js';
import db from '../src/database.js';

//corrected authentication token, since this was the main factor for the errors I had
import authenticateToken from '../middleware/authMiddleware.js';

jest.mock('../middleware/authMiddleware.js', () => ({
  __esModule: true,
  default: jest.fn((req, res, next) => {
    req.user = { id: 1 }; //mock authenticated user
    next();
  }),
}));

jest.mock('../src/database.js'); //mock database after imports

let app;
//setting up the mock express app and database behavior
beforeAll(() => {
  app = express();
  app.use(express.json());
  app.use('/api/transactions', transactionRoutes);

  db.all.mockReset();
  db.get.mockReset();
  db.run.mockReset();
});

beforeEach(() => {
    jest.clearAllMocks();
  });
//testing for the GET
describe('Transactions API', () => {
    it('GET /api/transactions should return transaction data', async () => {
        const mockTransactionData = [
            { transactionId: 1, amount: 200, description: 'Transfer', date: '2023-10-01', user_id: 1 },
            { transactionId: 2, amount: 90, description: 'Withdrawal', date: '2023-10-02', user_id: 1 },
        ];
//mocking the db call
        db.all.mockImplementation((sql, params, callback) => callback(null, mockTransactionData));

        const response = await request(app).get('/api/transactions');

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(mockTransactionData);
        expect(db.all).toHaveBeenCalledWith(
            'SELECT transactionId, amount, description, date, user_id FROM transactions WHERE user_id = ?',
            [1],
            expect.any(Function)
        );
    });
//testing for errors
    it('should handle errors when getting transactions', async () => {
        const mockError = new Error('Database error');
        db.all.mockImplementation((sql, params, callback) =>
            callback(mockError, null)
        );

        const response = await request(app).get('/api/transactions');

        expect(response.statusCode).toBe(500);
        expect(response.body).toEqual({ error: 'Database error' });
    });
//testing post
    it('POST /api/transactions should create a new transaction', async () => {
        const newTransaction = { amount: 100, description: 'Deposit', date: '2023-10-03' };
        const mockLastID = 2;
        const mockCreatedTransaction = { transactionId: mockLastID, ...newTransaction, user_id: 1 };

        db.run.mockImplementation(function (sql, params, callback) {
            callback.call({ lastID: mockLastID }, null);
        });
        db.get.mockImplementation((sql, params, callback) =>
            callback(null, mockCreatedTransaction)
        );

        const response = await request(app)
            .post('/api/transactions')
            .send(newTransaction);

        expect(response.statusCode).toBe(201);
        expect(response.body).toEqual(mockCreatedTransaction);
        expect(db.run).toHaveBeenCalledWith(
            'INSERT INTO transactions (amount, description, date, user_id) VALUES (?, ?, ?, ?)',
            [newTransaction.amount, newTransaction.description, newTransaction.date, 1],
            expect.any(Function)
        );
        expect(db.get).toHaveBeenCalledWith(
            'SELECT transactionId, amount, description, date, user_id FROM transactions WHERE transactionId = ?',
            [mockLastID],
            expect.any(Function)
        );
    });
//testing for errors
    it('should handle errors when creating a new transaction', async () => {
        const newTransaction = { amount: 100, description: 'Deposit', date: '2023-10-03' };
        const mockError = new Error('Database insertion error');

        db.run.mockImplementation((sql, params, callback) =>
            callback(mockError)
        );

        const response = await request(app)
            .post('/api/transactions')
            .send(newTransaction);

        expect(response.statusCode).toBe(500);
        expect(response.body).toEqual({ error: 'Database error', details: 'Database insertion error' });
    });

    it('should PUT (update) a transaction', async () => {
        const transactionIdToUpdate = 1;
        const updatedTransaction = { amount: 150, description: 'Updated Description', date: '2023-10-04' };
        const mockExistingTransaction = { transactionId: transactionIdToUpdate, amount: 100, description: 'Original Description', date: '2023-10-01', user_id: 1 };
        const mockUpdatedTransaction = { transactionId: transactionIdToUpdate, ...updatedTransaction, user_id: 1 };

        db.get
        .mockImplementationOnce((sql, params, callback) => callback(null, mockExistingTransaction)) // first: check ownership
        .mockImplementationOnce((sql, params, callback) => callback(null, mockUpdatedTransaction)); // second: get updated
  
      db.run.mockImplementation((sql, params, callback) => callback(null));
  
      const response = await request(app)
        .put(`/api/transactions/${transactionIdToUpdate}`)
        .send(updatedTransaction);
  
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(mockUpdatedTransaction);
    });

    it('should DELETE an existing transaction', async () => {
        const transactionIdToDelete = 1;
        const mockExistingTransaction = { transactionId: transactionIdToDelete, amount: 100, description: 'Groceries', date: '2023-10-04',  user_id: 1 };
    
        db.get.mockImplementation((sql, params, callback) => callback(null, mockExistingTransaction));
        db.run.mockImplementation((sql, params, callback) => callback(null));
    
        const response = await request(app)
          .delete(`/api/transactions/${transactionIdToDelete}`);
    
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ message: 'Transaction deleted successfully' });
      });
    });
