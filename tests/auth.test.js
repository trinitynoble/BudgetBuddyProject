import request from 'supertest';
import express from 'express';
import authRoutes from '../src/api/auth.js';
import db from '../src/database.js';

jest.mock('../src/database.js');
jest.mock('bcrypt'); // mock bcrypt since we dont want to interact with the real hashing
jest.mock('jsonwebtoken'); 

let app;
//setting up the express app
beforeAll(() => {
  app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
//ensure there is a clean state for testing
  db.get.mockReset();
  db.run.mockReset();
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Auth API', () => {
    //registration tests
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const mockUser = {
        user_firstname: 'John',
        user_lastname: 'Doe',
        user_email: 'john@example.com',
        user_phonenumber: '1234567890',
        user_password: 'securepassword',
      };
//mock db insert after successful registration
      db.run.mockImplementationOnce(function (sql, params, callback) {
        callback.call({ lastID: 1 }, null); // Ensure this mock correctly simulates a successful insert
    });
    
//post to the register endpoint
      const response = await request(app).post('/api/auth/register').send(mockUser);

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        id: 1,
        user_firstname: 'John',
        user_lastname: 'Doe',
        user_email: 'john@example.com',
        user_phonenumber: '1234567890',
      });
    });

    it('should handle missing fields', async () => {
      const response = await request(app).post('/api/auth/register').send({
        user_email: 'missing@example.com',
      });

      expect(response.statusCode).toBe(400);
      expect(response.body).toEqual({ error: 'All fields are required.' });
    });

    it('should handle database errors during registration', async () => {
      db.run.mockImplementation((sql, params, callback) =>
        callback(new Error('DB insert error'))
      );
//registration request
      const response = await request(app).post('/api/auth/register').send({
        user_firstname: 'Jane',
        user_lastname: 'Doe',
        user_email: 'jane@example.com',
        user_phonenumber: '1234567890',
        user_password: 'pass123',
      });
//give the error should there be a db error
      expect(response.statusCode).toBe(400);
      expect(response.body).toEqual({ error: 'Email already registered or DB error.' });
    });
  });//mock login
  describe('POST /api/auth/login', () => {
    it('should log in a user and return a token', async () => {
      const bcrypt = require('bcrypt');
      const jwt = require('jsonwebtoken');

      const mockUser = {
        user_id: 1,
        user_email: 'john@example.com',
        user_password: await bcrypt.hash('securepassword', 10),
        user_firstname: 'John',
        user_lastname: 'Doe',
        user_phonenumber: '1234567890',
      };
//getting the user and returning
      db.get.mockImplementation((sql, params, callback) =>
        callback(null, mockUser)
      );
//mock password comparisson
      bcrypt.compare.mockResolvedValue(true); // Mock bcrypt.compare
      jwt.sign.mockReturnValue('mocked-jwt-token'); // Mock jwt.sign

      const response = await request(app).post('/api/auth/login').send({
        user_email: 'john@example.com',
        user_password: 'securepassword',
      });
//return successful response if login is successful
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        token: 'mocked-jwt-token',
        user: {
          id: mockUser.user_id,
          user_firstname: 'John',
          user_lastname: 'Doe',
          user_email: 'john@example.com',
          user_phonenumber: '1234567890',
        },
      });
        //check that the database and bcrypt methods were called with the correct parameters
      expect(db.get).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE user_email = ?',
        ['john@example.com'],
        expect.any(Function)
      );
      expect(bcrypt.compare).toHaveBeenCalledWith('securepassword', mockUser.user_password);
      expect(jwt.sign).toHaveBeenCalled();
    });

    it('should return error on wrong password', async () => {
      const bcrypt = require('bcrypt');

      const mockUser = {
        user_id: 1,
        user_email: 'wrong@example.com',
        user_password: await bcrypt.hash('rightpassword', 10),
      };

      db.get.mockImplementation((sql, params, callback) =>
        callback(null, mockUser)
      );
//return false if password is wrong
      bcrypt.compare.mockResolvedValue(false); 
      const response = await request(app).post('/api/auth/login').send({
        user_email: 'wrong@example.com',
        user_password: 'wrongpassword',
      });

      expect(response.statusCode).toBe(401);
      expect(response.body).toEqual({ error: 'Invalid email or password.' });
    });
//simulate a user not found
    it('should return error if user not found', async () => {
      db.get.mockImplementation((sql, params, callback) =>
        callback(null, undefined)
      );

      const response = await request(app).post('/api/auth/login').send({
        user_email: 'notfound@example.com',
        user_password: 'doesnotmatter',
      });

      expect(response.statusCode).toBe(401);
      expect(response.body).toEqual({ error: 'Invalid email or password.' });
    });

    it('should return 401 if password does not match', async () => {
      const bcrypt = require('bcrypt');

      const mockUser = {
        user_id: 1,
        user_email: 'user@example.com',
        user_password: await bcrypt.hash('hashedPassword', 10),
      };

      db.get.mockImplementation((sql, params, callback) => {
        callback(null, mockUser);
      });

      bcrypt.compare.mockResolvedValue(false); //simulate password mismatch

      const response = await request(app).post('/api/auth/login').send({
        user_email: 'user@example.com',
        user_password: 'wrongPassword',
      });

      expect(response.statusCode).toBe(401);
      expect(response.body).toEqual({ error: 'Invalid email or password.' });
    });

    it('should return 500 if db error occurs', async () => {
      db.get.mockImplementation((sql, params, callback) => {
        callback(new Error('DB read error'), null);
      });

      const response = await request(app).post('/api/auth/login').send({
        user_email: 'user@example.com',
        user_password: 'password',
      });

      expect(response.statusCode).toBe(401);
      expect(response.body).toEqual({ error: 'Invalid email or password.' });
    });
  });
});
