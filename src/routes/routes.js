import { Router } from "express";
import crefisa from "./bots/crefisa.js"; // Importa o bot Crefisa

const router = Router();

// Cada bot fica em um subrota
router.use("/crefisa", crefisa);

export default router;