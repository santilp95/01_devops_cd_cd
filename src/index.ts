import express, { Request, Response } from "express";

const app = express();
app.use(express.json());

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

app.get("/api/greet", (req: Request, res: Response) => {
  const name = (req.query.name as string) || "mundo";
  res.status(200).json({ message: `Hola, ${name}!` });
});

interface SumBody {
  a: number;
  b: number;
}

app.post("/api/sum", (req: Request<unknown, unknown, Partial<SumBody>>, res: Response) => {
  /* istanbul ignore next -- express.json() ya garantiza req.body como objeto; fallback defensivo */
  const { a, b } = req.body ?? {};
  if (typeof a !== "number" || typeof b !== "number") {
    return res.status(400).json({ error: "a y b deben ser numeros" });
  }
  return res.status(200).json({ result: a + b });
});

const PORT = Number(process.env.PORT) || 8080;
/* istanbul ignore next -- arranque real del servidor, no aplica en tests unitarios */
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
  });
}

export default app;
