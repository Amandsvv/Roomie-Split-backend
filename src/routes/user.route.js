import { Router } from "express";
import { registerUser , loginUser,getCurrentUser,logoutUser} from "../controllers/user.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router();

router.route("/signup").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT,logoutUser);
router.route("/auth/me").post(verifyJWT,getCurrentUser)

export default router;