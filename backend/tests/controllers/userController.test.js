const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const User = require('../../models/userModel');
const { signupUser, loginUser, pingServer } = require('../../controllers/userController');

// Create a mock express app for testing controllers
const app = express();
app.use(express.json());

// Mock routes
app.post('/api/user/signup', signupUser);
app.post('/api/user/login', loginUser);
app.get('/api/user/ping', pingServer);

// Mock the jwt token creation
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('test-token')
}));

describe('User Controller Tests', () => {
  
  describe('Signup Controller', () => {
    it('should create a new user with valid credentials', async () => {
      const userData = {
        email: 'testsignup@example.com',
        password: 'TestPassword123!'
      };
      
      const response = await request(app)
        .post('/api/user/signup')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.token).toBe('test-token');
    });
    
    it('should return 400 with error message for invalid data', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'weak'
      };
      
      const response = await request(app)
        .post('/api/user/signup')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(400);
      
      expect(response.body.error).toBeDefined();
    });
    
    it('should return 400 for missing fields', async () => {
      const userData = {
        email: 'test@example.com'
        // Missing password
      };
      
      const response = await request(app)
        .post('/api/user/signup')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(400);
      
      expect(response.body.error).toBe('All fields must be filled');
    });
  });
  
  describe('Login Controller', () => {
    beforeEach(async () => {
      // Create a test user for login tests
      await User.signup('testlogin@example.com', 'TestPassword123!');
    });
    
    it('should login a user with valid credentials', async () => {
      const loginData = {
        email: 'testlogin@example.com',
        password: 'TestPassword123!'
      };
      
      const response = await request(app)
        .post('/api/user/login')
        .send(loginData)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(loginData.email);
      expect(response.body.user.token).toBe('test-token');
    });
    
    it('should return 400 with error message for invalid credentials', async () => {
      const loginData = {
        email: 'testlogin@example.com',
        password: 'WrongPassword123!'
      };
      
      const response = await request(app)
        .post('/api/user/login')
        .send(loginData)
        .expect('Content-Type', /json/)
        .expect(400);
      
      expect(response.body.error).toBeDefined();
    });
    
    it('should return 400 for non-existent user', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'TestPassword123!'
      };
      
      const response = await request(app)
        .post('/api/user/login')
        .send(loginData)
        .expect('Content-Type', /json/)
        .expect(400);
      
      expect(response.body.error).toBe('Invalid email');
    });
  });
  
  describe('Ping Server Controller', () => {
    it('should return a 200 status with alive message', async () => {
      const response = await request(app)
        .get('/api/user/ping')
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body.message).toBe('Server is alive');
    });
  });
});