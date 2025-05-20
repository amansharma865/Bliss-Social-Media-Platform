import express from 'express';
import { signup ,login,logout,getMe} from '../controllers/auth.controller.js';
import { protectRoute } from '../middleware/protectRoute.js';

const router = express.Router();

//this protectroute is the middleware we need to make 
router.get('/me',protectRoute ,getMe);
router.post('/signUp', signup);
router.post('/login', login);
router.post('/logout', logout);

export default router; 