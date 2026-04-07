import { Router } from "express";
import { authMiddleware, requireRole } from "../../middlewares/auth.middleware";
import { UserController } from "./user.controller";

const router = Router();

router.use(authMiddleware);
router.use(requireRole("ADMIN"));

router.get("/", UserController.getUsers);
router.post("/", UserController.createUser);
router.delete("/:id", UserController.deleteUser);
router.patch("/:id", UserController.updateUserProfile);
router.patch("/:id/role", UserController.updateUserRole);

export default router;
