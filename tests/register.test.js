const request = require('supertest');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const registerRoute = require('../src/api/auth.js'); // Adjust the path to your auth.js file

jest.mock('sqlite3', () => ({
  verbose: () => ({
    Database: jest.fn(() => ({
      run: jest.fn().mockImplementation((sql, params, callback) => {
        callback(null);
      }),
      get: jest.fn().mockImplementation((sql, params, callback) => {
        callback(null, undefined);
      }),
      close: jest.fn(),
    })),
  }),
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(async (password, saltRounds) => `hashed_${password}`),
}));
const app = express();
app.use(express.json());
app.use('/api', registerRoute);

describe('POST /api/register', () => {
  it('should register a new user successfully', async () => {
    const userData = {
      user_firstname: 'Test',
      user_lastname: 'User',
      user_email: 'test@example.com',
      user_phonenumber: '123-456-7890',
      user_password: 'password123',
    };

    const response = await request(app)
      .post('/api/register')
      .send(userData)
      .expect(200);

    expect(response.body).toEqual({ message: 'Registration successful!' });
    expect(sqlite3.verbose().Database().run).toHaveBeenCalledWith(
      'INSERT INTO users (user_firstname, user_lastname, user_email, user_phonenumber, user_password) VALUES (?, ?, ?, ?, ?)',
      [
        'Test',
        'User',
        'test@example.com',
        '123-456-7890',
        'hashed_password123',
      ],
      expect.any(Function)
    );
  });

  it('should return an error if the email already exists', async () => {
    //mock database to return an existing user
    sqlite3.verbose().Database().get.mockImplementationOnce((sql, params, callback) => {
      callback(null, { user_id: 1, user_email: 'test@example.com' });
    });

    const userData = {
      user_firstname: 'Test',
      user_lastname: 'User',
      user_email: 'test@example.com',
      user_phonenumber: '123-456-7890',
      user_password: 'password123',
    };

    const response = await request(app)
      .post('/api/register')
      .send(userData)
      .expect(400);

    expect(response.body).toEqual({ error: 'Email already exists' });
    expect(sqlite3.verbose().Database().run).not.toHaveBeenCalled();
  });
});