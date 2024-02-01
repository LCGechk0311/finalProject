import { Router } from 'express';
import{
    userLogin,
} from '../controllers/authController';
import { localAuthentication } from '../middlewares/authenticateLocal';
import { wrapAsyncController } from '../utils/wrapper';

const authRouter = Router();

authRouter.post(
    '/login',
    localAuthentication,
    wrapAsyncController(userLogin),
  );

  export default authRouter;