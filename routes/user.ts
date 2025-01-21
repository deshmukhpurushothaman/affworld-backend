import express from 'express';
import {
  forgotPasswordHandler,
  loginUserHandler,
  logoutUserHandler,
  registerUserHandler,
  resetPasswordHandler,
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

router.post('/forgot-password', forgotPasswordHandler);
router.post('/reset-password/:token', resetPasswordHandler);

export default router;
