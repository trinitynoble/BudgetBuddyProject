const request = require('supertest');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const loginRoute = require('../api/auth'); // Adjust the path to your auth.js file
const { generateToken } = require('../middleware/authMiddleware'); 

jest.mock('sqlite3', () => ({
  verbose: () => ({
    Database: jest.fn(() => ({
      get: jest.fn(), 
      close: jest.fn(),
    })),
  }),
}));

jest.mock('bcrypt', () => ({
  compare: jest.fn(), 
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mocked_token'),
}));

jest.mock('../middleware/authMiddleware', () => ({
  generateToken: jest.fn(() => 'mocked_token'),
}));
const app = express();
app.use(express.json());
app.use('/api', loginRoute);

describe('POST /api/login', () => {
  it('should log in a user successfully with correct credentials', async () => {
    sqlite3.verbose().Database().get.mockImplementationOnce((sql, params, callback) => {
      callback(null, { user_id: 1, user_email: 'test@example.com', user_password: 'hashed_password' });
    });
    bcrypt.compare.mockImplementationOnce(async () => true);

    const userData = {
      user_email: 'test@example.com',
      user_password: 'password',
    };

    const response = await request(app)
      .post('/api/login')
      .send(userData)
      .expect(200);
    expect(response.body).toEqual({ token: 'mocked_token' });
    expect(sqlite3.verbose().Database().get).toHaveBeenCalledWith(
      'SELECT * FROM users WHERE user_email = ?',
      ['test@example.com'],
      expect.any(Function)
    );
    expect(bcrypt.compare).toHaveBeenCalledWith('password', 'hashed_password');
    expect(generateToken).toHaveBeenCalledWith({ id: 1 });
  });

  it('should return an error for invalid email', async () => {
    sqlite3.verbose().Database().get.mockImplementationOnce((sql, params, callback) => {
      callback(null, undefined);
    });

    const userData = {
      user_email: 'nonexistent@example.com',
      user_password: 'password',
    };
    const response = await request(app)
      .post('/api/login')
      .send(userData)
      .expect(401);

    expect(response.body).toEqual({ error: 'Invalid credentials' });
    expect(bcrypt.compare).not.toHaveBeenCalled();
    expect(generateToken).not.toHaveBeenCalled();
  });

  it('should return an error for incorrect password', async () => {
    sqlite3.verbose().Database().get.mockImplementationOnce((sql, params, callback) => {
      callback(null, { user_id: 1, user_email: 'test@example.com', user_password: 'hashed_password' });
    });
    bcrypt.compare.mockImplementationOnce(async () => false);

    const userData = {
      user_email: 'test@example.com',
      user_password: 'wrong_password',
    };

    const response = await request(app)
      .post('/api/login')
      .send(userData)
      .expect(401);
    expect(response.body).toEqual({ error: 'Invalid credentials' });
    expect(bcrypt.compare).toHaveBeenCalledWith('wrong_password', 'hashed_password');
    expect(generateToken).not.toHaveBeenCalled();
  });

});