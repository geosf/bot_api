import { Router } from "express";
import { enqueueBotJob } from "../../services/queueManager.js";

const router = Router();

router.post("/", async (req, res) => {
  const initialMemory = process.memoryUsage().heapUsed;
  try {
    const { cpf, clientName, benefitNumber } = req.body;

    if (!cpf || !clientName || !benefitNumber) {
      return res
        .status(400)
        .json({ error: "Todos os campos são obrigatórios." });
    }

    const result = await enqueueBotJob(cpf, benefitNumber, clientName);

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryConsumed = finalMemory - initialMemory;

    console.log(`Memória consumida: ${memoryConsumed}`);
    res.json(result);
  } catch (error) {
    console.error("Erro no bot Crefisa:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
