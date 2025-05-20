import express from 'express';
import { protectRoute } from '../middleware/protectRoute.js';
import { getUserProfile, followUnfollowUser, getSuggestedUsers, updateUser, getUserFollowers, getUserFollowing } from '../controllers/user.controller.js';

const router = express.Router();

router.get('/profile/:username', protectRoute, getUserProfile)
router.get('/suggested', protectRoute, getSuggestedUsers)
router.post('/follow/:id', protectRoute, followUnfollowUser)
router.put('/update', protectRoute, updateUser) // Changed from POST to PUT

router.get('/:userId/followers', protectRoute, getUserFollowers);
router.get('/:userId/following', protectRoute, getUserFollowing);

export default router;
