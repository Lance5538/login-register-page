import { Router } from "express";
import { InventoryController } from "./inventory.controller";
import {
  authMiddleware,
  requireRole,
} from "../../middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/", InventoryController.getInventory);
router.get("/transactions", InventoryController.getTransactions);

router.post(
  "/increase",
  requireRole("ADMIN", "STAFF"),
  InventoryController.increase
);

router.post(
  "/decrease",
  requireRole("ADMIN", "STAFF"),
  InventoryController.decrease
);

router.post(
  "/transfer",
  requireRole("ADMIN", "STAFF"),
  InventoryController.transfer
);

router.post(
  "/reserve",
  requireRole("ADMIN", "STAFF"),
  InventoryController.reserve
);

router.post(
  "/release",
  requireRole("ADMIN", "STAFF"),
  InventoryController.release
);

router.post(
  "/commit-reserved",
  requireRole("ADMIN", "STAFF"),
  InventoryController.commitReserved
);

export default router;