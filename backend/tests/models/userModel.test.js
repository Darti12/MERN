const User = require('../../models/userModel');
const mongoose = require('mongoose');

describe('User Model Tests', () => {
  
  describe('User Signup', () => {
    it('should create a new user with valid credentials', async () => {
      const email = 'test@example.com';
      const password = 'TestPassword123!';
      
      const user = await User.signup(email, password);
      
      expect(user).toBeDefined();
      expect(user.email).toBe(email);
      expect(user.password).not.toBe(password); // Password should be hashed
      expect(mongoose.Types.ObjectId.isValid(user._id)).toBe(true);
    });
    
    it('should throw error when email is missing', async () => {
      const password = 'TestPassword123!';
      
      await expect(User.signup('', password)).rejects.toThrow('All fields must be filled');
    });
    
    it('should throw error when password is missing', async () => {
      const email = 'test@example.com';
      
      await expect(User.signup(email, '')).rejects.toThrow('All fields must be filled');
    });
    
    it('should throw error when email is invalid', async () => {
      const email = 'invalid-email';
      const password = 'TestPassword123!';
      
      await expect(User.signup(email, password)).rejects.toThrow('Email is not valid');
    });
    
    it('should throw error when password is weak', async () => {
      const email = 'test@example.com';
      const password = 'weak';
      
      await expect(User.signup(email, password)).rejects.toThrow('Password is not strong enough');
    });
    
    it('should throw error when email is already in use', async () => {
      const email = 'duplicate@example.com';
      const password = 'TestPassword123!';
      
      await User.signup(email, password);
      
      await expect(User.signup(email, password)).rejects.toThrow('Email already in use');
    });
  });
  
  describe('User Login', () => {
    it('should login a user with valid credentials', async () => {
      const email = 'login@example.com';
      const password = 'TestPassword123!';
      
      // Create a user first
      await User.signup(email, password);
      
      // Attempt to login
      const user = await User.login(email, password);
      
      expect(user).toBeDefined();
      expect(user.email).toBe(email);
    });
    
    it('should throw error when email is missing', async () => {
      const password = 'TestPassword123!';
      
      await expect(User.login('', password)).rejects.toThrow('All fields must be filled');
    });
    
    it('should throw error when password is missing', async () => {
      const email = 'test@example.com';
      
      await expect(User.login(email, '')).rejects.toThrow('All fields must be filled');
    });
    
    it('should throw error when email is invalid', async () => {
      const email = 'invalid-email';
      const password = 'TestPassword123!';
      
      await expect(User.login(email, password)).rejects.toThrow('Email is not valid');
    });
    
    it('should throw error when email does not exist', async () => {
      const email = 'nonexistent@example.com';
      const password = 'TestPassword123!';
      
      await expect(User.login(email, password)).rejects.toThrow('Invalid email');
    });
    
    it('should throw error when password is incorrect', async () => {
      const email = 'password@example.com';
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword123!';
      
      // Create a user first
      await User.signup(email, password);
      
      // Attempt to login with wrong password
      await expect(User.login(email, wrongPassword)).rejects.toThrow('Incorrect password');
    });
  });
});