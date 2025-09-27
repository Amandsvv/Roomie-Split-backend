import { Router } from "express";
import { registerUser , loginUser} from "../controllers/user.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getCurrentUser, logoutUser } from "../../../../project-3/src/controllers/user.controllers.js";

const router = Router();

router.route("/signup").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT,logoutUser);
router.route("/auth/me").post(verifyJWT,getCurrentUser)

export default router;