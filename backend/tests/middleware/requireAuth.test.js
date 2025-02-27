const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../../models/userModel');
const requireAuth = require('../../middleware/requireAuth');

// Mock the dependencies
jest.mock('jsonwebtoken');
jest.mock('../../models/userModel');

describe('Require Auth Middleware', () => {
  let req, res, next;
  
  beforeEach(() => {
    // Set up request, response and next function for each test
    req = {
      headers: {}
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    next = jest.fn();
    
    // Reset mocks
    jest.clearAllMocks();
  });
  
  it('should return 401 if no authorization header is present', async () => {
    await requireAuth(req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Authorization token required' });
    expect(next).not.toHaveBeenCalled();
  });
  
  it('should return 401 if token verification fails', async () => {
    req.headers.authorization = 'Bearer invalid-token';
    
    jwt.verify.mockImplementation(() => {
      throw new Error('Invalid token');
    });
    
    await requireAuth(req, res, next);
    
    expect(jwt.verify).toHaveBeenCalledWith('invalid-token', process.env.SECRET);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Request is not authorized' });
    expect(next).not.toHaveBeenCalled();
  });
  
  it('should call next() if authentication succeeds', async () => {
    const userId = new mongoose.Types.ObjectId();
    req.headers.authorization = 'Bearer valid-token';
    
    jwt.verify.mockReturnValue({ _id: userId });
    
    const mockUser = { _id: userId };
    User.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser)
    });
    
    await requireAuth(req, res, next);
    
    expect(jwt.verify).toHaveBeenCalledWith('valid-token', process.env.SECRET);
    expect(User.findOne).toHaveBeenCalledWith({ _id: userId });
    expect(req.user).toEqual(mockUser);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
  
  it('should call next() if user exists', async () => {
    const userId = new mongoose.Types.ObjectId();
    req.headers.authorization = 'Bearer valid-token';
    
    jwt.verify.mockReturnValue({ _id: userId });
    
    const mockUser = { _id: userId };
    User.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser)
    });
    
    await requireAuth(req, res, next);
    
    expect(jwt.verify).toHaveBeenCalledWith('valid-token', process.env.SECRET);
    expect(User.findOne).toHaveBeenCalledWith({ _id: userId });
    expect(req.user).toEqual(mockUser);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});