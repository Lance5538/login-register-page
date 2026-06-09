import { Router } from "express";
import { DomainEventProcessor } from "./domain-event.processor";

const router = Router();

router.post("/process", async (req, res, next) => {
  try {
    const limit = req.body?.limit ?? 10;
    const results = await DomainEventProcessor.processPendingEvents(limit);

    res.status(200).json({
      message: "Pending domain events processed",
      count: results.length,
      results,
    });
  } catch (error) {
    next(error);
  }
});

export default router;