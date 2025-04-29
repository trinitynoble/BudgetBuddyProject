const request = require('supertest');
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const db = require('./database.js'); 
const authenticateToken = require('../middleware/authMiddleware.js'); 

//Mock dependencies
jest.mock('bcrypt');
jest.mock('jsonwebtoken');
jest.mock('cors');
jest.mock('./database.js');
jest.mock('../middleware/authMiddleware.js');

let app;
const SECRET = 'p@ssw0rd';

beforeAll(() => {
    app = express();
    app.use(cors());
    app.use(express.json());

    //define the routes directly on the app instance for testing
    app.post('/api/register', async (req, res) => {
        const { user_firstname, user_lastname, user_email, user_phonenumber, user_password } = req.body;
        if (!user_firstname || !user_lastname || !user_email || !user_phonenumber || !user_password) {
            return res.status(400).json({ error: 'All fields are required.' });
        }
        try {
            db.get.mockImplementationOnce((sql, params, callback) => {
                callback(null, null); //mock no existing user
            });
            bcrypt.hash.mockResolvedValue('hashedPassword');
            db.run.mockImplementationOnce(function (sql, params, callback) {
                callback.call({ lastID: 1 }, null);
            });
            res.json({ id: 1, user_firstname, user_lastname, user_email, user_phonenumber });
        } catch (err) {
            res.status(500).json({ error: 'Server error' });
        }
    });

    app.post('/api/login', (req, res) => {
        const { user_email, user_password } = req.body;
        if (!user_email || !user_password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }
        db.get.mockImplementationOnce((sql, params, callback) => {
            callback(null, { user_id: 1, user_email: user_email, user_password: 'hashedPassword' });
        });
        bcrypt.compare.mockResolvedValue(true);
        jwt.sign.mockReturnValue('mockedToken');
        res.json({ token: 'mockedToken', user: { id: 1, user_email } });
    });

    app.get('/api/profile', authenticateToken, (req, res) => {
        res.json({ message: `Welcome, test@example.com!`, user: { id: 1, email: 'test@example.com' } });
    });

    //mock the middleware to always pass for simplicity in these tests
    authenticateToken.mockImplementation((req, res, next) => {
        req.user = { id: 1, email: 'test@example.com' };
        next();
    });
});

beforeEach(() => {
    //reset mocks before each test
    bcrypt.hash.mockReset();
    bcrypt.compare.mockReset();
    jwt.sign.mockReset();
    db.run.mockReset();
    db.get.mockReset();
    authenticateToken.mockClear();
});
//creating the tests for the server endpoints
describe('Server API Endpoints', () => {
    describe('/api/register', () => {
        it('should register a new user successfully', async () => {
            const newUser = {
                user_firstname: 'Test',
                user_lastname: 'User',
                user_email: 'test@example.com',
                user_phonenumber: '000-000-0000',
                user_password: 'testpassword',
            };
            bcrypt.hash.mockResolvedValue('hashedPassword');
            db.get.mockImplementationOnce((sql, params, callback) => callback(null, null)); //if there is no existing user
            db.run.mockImplementationOnce((sql, params, callback) => callback.call({ lastID: 1 }, null));

            const response = await request(app)
                .post('/api/register')
                .send(newUser);

            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual({
                id: 1,
                user_firstname: newUser.user_firstname,
                user_lastname: newUser.user_lastname,
                user_email: newUser.user_email,
                user_phonenumber: newUser.user_phonenumber,
            });
            expect(bcrypt.hash).toHaveBeenCalledWith(newUser.user_password, 10);
            expect(db.run).toHaveBeenCalledWith(//a mock for the insert
                `INSERT INTO users (user_firstname, user_lastname, user_email, user_phonenumber, user_password) VALUES (?, ?, ?, ?, ?)`,
                [newUser.user_firstname, newUser.user_lastname, newUser.user_email, newUser.user_phonenumber, 'hashedPassword'],
                expect.any(Function)
            );
        });

        it('should return 400 if any required field is missing', async () => {
            const incompleteUser = {
                user_firstname: 'Test',
                user_lastname: 'User',
                user_email: 'test@example.com',
                user_phonenumber: '000-000-0000',
            };

            const response = await request(app)
                .post('/api/register')
                .send(incompleteUser);
//making sure all required fields are present
            expect(response.statusCode).toBe(400);
            expect(response.body).toEqual({ error: 'All fields are required.' });
            expect(bcrypt.hash).not.toHaveBeenCalled();
            expect(db.run).not.toHaveBeenCalled();
        });
//this is the test for the duplicate email
        it('should return 400 if email is already registered', async () => {
            const newUser = {
                user_firstname: 'Test',
                user_lastname: 'User',
                user_email: 'test@example.com',
                user_phonenumber: '000-000-0000',
                user_password: 'testpassword',
            };
            db.get.mockImplementationOnce((sql, params, callback) => callback(null, { user_email: newUser.user_email }));

            const response = await request(app)
                .post('/api/register')
                .send(newUser);

            expect(response.statusCode).toBe(400);
            expect(response.body).toEqual({ error: 'Email already registered.' });
            expect(bcrypt.hash).not.toHaveBeenCalled();
            expect(db.run).not.toHaveBeenCalled();
        });
//test for database error
        it('should return 500 if there is a database error during registration', async () => {
            const newUser = {
                user_firstname: 'Test',
                user_lastname: 'User',
                user_email: 'test@example.com',
                user_phonenumber: '000-000-0000',
                user_password: 'testpassword',
            };
            bcrypt.hash.mockResolvedValue('hashedPassword');
            db.get.mockImplementationOnce((sql, params, callback) => callback(new Error('Database error'), null));

            const response = await request(app)
                .post('/api/register')
                .send(newUser);

            expect(response.statusCode).toBe(500);
            expect(response.body).toEqual({ error: 'Database error.' });
            expect(bcrypt.hash).toHaveBeenCalled();
            expect(db.run).not.toHaveBeenCalled();
        });
            //test for hashed password
        it('should return 500 if there is an error during password hashing', async () => {
            const newUser = {
                user_firstname: 'Test',
                user_lastname: 'User',
                user_email: 'test@example.com',
                user_phonenumber: '000-000-0000',
                user_password: 'testpassword',
            };
            bcrypt.hash.mockRejectedValue(new Error('Hashing error'));

            const response = await request(app)
                .post('/api/register')
                .send(newUser);

            expect(response.statusCode).toBe(500);
            expect(response.body).toEqual({ error: 'Server error' });
            expect(bcrypt.hash).toHaveBeenCalledWith(newUser.user_password, 10);
            expect(db.run).not.toHaveBeenCalled();
        });
    });
//this is the test for the login method 
    describe('/api/login', () => {
        it('should login a user successfully and return a token', async () => {
            const loginCredentials = {
                user_email: 'test@example.com',
                user_password: 'testpassword',
            };
            db.get.mockImplementationOnce((sql, params, callback) => {
                callback(null, { user_id: 1, user_email: loginCredentials.user_email, user_password: 'hashedPassword' });
            });
            bcrypt.compare.mockResolvedValue(true);//mock token t
            jwt.sign.mockReturnValue('mockedToken');

            const response = await request(app)
                .post('/api/login')
                .send(loginCredentials);

            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual({
                token: 'mockedToken',
                user: { id: 1, user_email: loginCredentials.user_email },
            });
            expect(db.get).toHaveBeenCalledWith(
                `SELECT * FROM users WHERE user_email = ?`,
                [loginCredentials.user_email],
                expect.any(Function)
            );
            expect(bcrypt.compare).toHaveBeenCalledWith(loginCredentials.user_password, 'hashedPassword');
            expect(jwt.sign).toHaveBeenCalledWith({ id: 1, email: loginCredentials.user_email }, SECRET, { expiresIn: '1h' });
        });

        it('should return 400 if email or password is missing', async () => {
            const incompleteCredentials = {
                user_email: 'test@example.com',
            };

            const response = await request(app)
                .post('/api/login')
                .send(incompleteCredentials);

            expect(response.statusCode).toBe(400);
            expect(response.body).toEqual({ error: 'Email and password are required.' });
            expect(db.get).not.toHaveBeenCalled();
            expect(bcrypt.compare).not.toHaveBeenCalled();
            expect(jwt.sign).not.toHaveBeenCalled();
        });

        it('should return 401 for invalid email or password (user not found)', async () => {
            const loginCredentials = {
                user_email: 'nonexistent@example.com',
                user_password: 'testpassword',
            };
            db.get.mockImplementationOnce((sql, params, callback) => callback(null, null));

            const response = await request(app)
                .post('/api/login')
                .send(loginCredentials);

            expect(response.statusCode).toBe(401);
            expect(response.body).toEqual({ error: 'Invalid email or password.' });
            expect(db.get).toHaveBeenCalledWith(
                `SELECT * FROM users WHERE user_email = ?`,
                [loginCredentials.user_email],
                expect.any(Function)
            );
            expect(bcrypt.compare).not.toHaveBeenCalled();
            expect(jwt.sign).not.toHaveBeenCalled();
        });

        it('should return 401 for invalid email or password (incorrect password)', async () => {
            const loginCredentials = {
                user_email: 'test@example.com',
                user_password: 'wrongpassword',
            };
            db.get.mockImplementationOnce((sql, params, callback) => {
                callback(null, { user_id: 1, user_email: loginCredentials.user_email, user_password: 'hashedPassword' });
            });
            bcrypt.compare.mockResolvedValue(false);

            const response = await request(app)
                .post('/api/login')
                .send(loginCredentials);

            expect(response.statusCode).toBe(401);
            expect(response.body).toEqual({ error: 'Invalid email or password.' });
            expect(db.get).toHaveBeenCalledWith(
                `SELECT * FROM users WHERE user_email = ?`,
                [loginCredentials.user_email],
                expect.any(Function)
            );
            expect(bcrypt.compare).toHaveBeenCalledWith(loginCredentials.user_password, 'hashedPassword');
            expect(jwt.sign).not.toHaveBeenCalled();
        });

        it('should return 500 for database error during login', async () => {
            const loginCredentials = {
                user_email: 'test@example.com',
                user_password: 'testpassword',
            };
            db.get.mockImplementationOnce((sql, params, callback) => callback(new Error('Database error'), null));

            const response = await request(app)
                .post('/api/login')
                .send(loginCredentials);

            expect(response.statusCode).toBe(500);
            expect(response.body).toEqual({ error: 'Database error.' });
            expect(db.get).toHaveBeenCalledWith(
                `SELECT * FROM users WHERE user_email = ?`,
                [loginCredentials.user_email],
                expect.any(Function)
            );
            expect(bcrypt.compare).not.toHaveBeenCalled();
            expect(jwt.sign).not.toHaveBeenCalled();
        });
    });

    describe('/api/profile', () => {
        it('should return user profile data if authenticated', async () => {
            const response = await request(app)
                .get('/api/profile')
                .set('Authorization', 'Bearer mockedToken'); // Mocked token will be passed by the middleware mock

            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual({ message: 'Welcome, test@example.com!', user: { id: 1, email: 'test@example.com' } });
            expect(authenticateToken).toHaveBeenCalled();
        });
    });

    describe('/api/test', () => {
        it('should return a 200 status and a success message', async () => {
            const response = await request(app)
                .get('/api/test');

            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual({ message: 'Server is working' });
        });
    });

    describe('/', () => {
        it('should return a 200 status and the API running message', async () => {
            const response = await request(app)
                .get('/');

            expect(response.statusCode).toBe(200);
            expect(response.text).toBe('API is running!');
        });
    });
});