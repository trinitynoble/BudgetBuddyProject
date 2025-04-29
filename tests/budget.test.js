import request from 'supertest';
import express from 'express';
import budgetRoutes from '../src/api/bud.js';
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
  app.use('/api/budget', budgetRoutes);
//reset db mocks to avoid state leakage
  db.all.mockReset();
  db.get.mockReset();
  db.run.mockReset();
});
//testing for the GET
describe('Budget API', () => {
  it('GET /api/budget should return budget data', async () => {
    const mockBudgetData = [
      { budgetId: 1, budget_amount: 200, budget_description: 'Food', user_id: 1 },
      { budgetId: 2, budget_amount: 90, budget_description: 'Gas', user_id: 1 },
    ];

    db.all.mockImplementation((sql, params, callback) => callback(null, mockBudgetData));
//making the get request
    const response = await request(app).get('/api/budget');

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual(mockBudgetData);
    expect(db.all).toHaveBeenCalledWith(//ensuring the db call was made correctly
      'SELECT budgetId, budget_amount, budget_description, user_id FROM Budget WHERE user_id = ?',
      [1],
      expect.any(Function)
    );
  });

  it('should handle errors when getting budgets', async () => {
    const mockError = new Error('Database error');
    db.all.mockImplementation((sql, params, callback) => callback(mockError, null));

    const response = await request(app).get('/api/budget');
//simulate a db error
    expect(response.statusCode).toBe(500);
    expect(response.body).toEqual({ error: 'Database error' });
  });
//testing post
  it('POST /api/budget should create a new budget', async () => {
    const newBudget = { budget_amount: 100, budget_description: 'Groceries' };
    const mockLastID = 2;
    const mockCreatedBudget = { budgetId: mockLastID, ...newBudget, user_id: 1 };
//mock run for the budget creation
    db.run.mockImplementation(function (sql, params, callback) {
      callback.call({ lastID: mockLastID }, null);
    });

    db.get.mockImplementation((sql, params, callback) => callback(null, mockCreatedBudget));

    const response = await request(app)
      .post('/api/budget')
      .send(newBudget);

    expect(response.statusCode).toBe(201);
    expect(response.body).toEqual(mockCreatedBudget);
    expect(db.run).toHaveBeenCalledWith(//ensure the db insert and fetches were made correctly
      'INSERT INTO Budget (budget_amount, budget_description, user_id) VALUES (?, ?, ?)',
      [newBudget.budget_amount, newBudget.budget_description, 1],
      expect.any(Function)
    );
    expect(db.get).toHaveBeenCalledWith(
      'SELECT budgetId, budget_amount, budget_description, user_id FROM Budget WHERE budgetId = ?',
      [mockLastID],
      expect.any(Function)
    );
  });
//testing for the error handling
  it('should handle errors when creating a new budget', async () => {
    const newBudget = { budget_amount: 100, budget_description: 'Groceries' };
    const mockError = new Error('Database insertion error');

    db.run.mockImplementation((sql, params, callback) => callback(mockError));

    const response = await request(app)
      .post('/api/budget')
      .send(newBudget);

    expect(response.statusCode).toBe(500);
    expect(response.body).toEqual({ error: 'Database error', details: 'Database insertion error' });
  });
//testing update
  it('should PUT (update) a budget', async () => {
    const budgetIdToUpdate = 1;
    const updatedBudget = { budget_amount: 150, budget_description: 'Updated Description' };
    const mockExistingBudget = { budgetId: budgetIdToUpdate, budget_amount: 100, budget_description: 'Original', user_id: 1 };
    const mockUpdatedBudget = { budgetId: budgetIdToUpdate, ...updatedBudget, user_id: 1 };

    db.get
      .mockImplementationOnce((sql, params, callback) => callback(null, mockExistingBudget)) // first: check ownership
      .mockImplementationOnce((sql, params, callback) => callback(null, mockUpdatedBudget)); // second: get updated

    db.run.mockImplementation((sql, params, callback) => callback(null));

    const response = await request(app)
      .put(`/api/budget/${budgetIdToUpdate}`)
      .send(updatedBudget);

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual(mockUpdatedBudget);
  });
//testing for delelte
  it('should DELETE an existing budget', async () => {
    const budgetIdToDelete = 1;
    const mockExistingBudget = { budgetId: budgetIdToDelete, budget_amount: 100, budget_description: 'Groceries', user_id: 1 };

    db.get.mockImplementation((sql, params, callback) => callback(null, mockExistingBudget));
    db.run.mockImplementation((sql, params, callback) => callback(null));

    const response = await request(app)
      .delete(`/api/budget/${budgetIdToDelete}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ message: 'Budget deleted successfully' });
  });
});