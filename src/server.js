import express, { json } from "express";
import botRoutes from "./routes/routes.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(json());
app.use("/bot", botRoutes);

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});