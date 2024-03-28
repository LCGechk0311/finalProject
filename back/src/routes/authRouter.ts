import { Router } from 'express';
import { userLogin, sessionLogin } from '../controllers/authController';
import {
  localAuthentication,
  sessionLocalAuthentication,
} from '../middlewares/authenticateLocal';
import { wrapAsyncController } from '../utils/wrapper';

const authRouter = Router();

authRouter.post('/login', localAuthentication, wrapAsyncController(userLogin));

authRouter.post('/sessionLogin', sessionLocalAuthentication, wrapAsyncController(sessionLogin));

export default authRouter;
