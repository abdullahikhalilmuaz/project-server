import express from 'express';
import { register, login } from '../controllers/authController.js';

const userRoute = express.Router();

userRoute.post('/register', register);
userRoute.post('/login', login);

export default userRoute;