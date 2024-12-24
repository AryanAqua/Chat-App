import express from "express";
import { login, logout, register, updateProfile, updatePassword } from "../controllers/authController.js";
import { isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

router.post("/signup", register);
router.post("/login", login);
router.post("/logout", logout);
router.put("/update-profile", isAuthenticated, updateProfile);

export default router;