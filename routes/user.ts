import express from 'express';
import {
  loginUserHandler,
  logoutUserHandler,
  registerUserHandler,
} from '../controllers/user.controller';
import authenticate from '../middlewares/authenticate';

const router = express.Router();

// Use the correct route handler
router.post('/register', registerUserHandler);

router.post('/login', loginUserHandler);

router.post(
  '/logout',
  // logoutUserLimiter,
  authenticate(),
  logoutUserHandler
);

export default router;
