import { Router } from "express";
import { ProductController } from "./product.controller";
import {
  authMiddleware,
  requireRole,
} from "../../middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/", ProductController.getProducts);
router.get("/:id", ProductController.getProductById);

router.post("/", requireRole("ADMIN"), ProductController.createProduct);
router.patch("/:id", requireRole("ADMIN"), ProductController.updateProduct);
router.delete("/:id", requireRole("ADMIN"), ProductController.deleteProduct);

export default router;