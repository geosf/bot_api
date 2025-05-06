import { Router } from "express";
import { runBotCrefisa } from "../../services/crefisa.js"; // Importa a função do bot Crefisa

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { username, password, cpf, clientName, benefitNumber } = req.body;

    if (!username || !password || !cpf || !clientName || !benefitNumber) {
      return res
        .status(400)
        .json({ error: "Todos os campos são obrigatórios." });
    }

    const result = await runBotCrefisa(
      username,
      password,
      cpf,
      benefitNumber,
      clientName
    );

    res.json(result);
  } catch (error) {
    console.error("Erro no bot Crefisa:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
