import express, { NextFunction, Request, Response } from "express";

const app = express();
app.use(express.json());

const VERSION = process.env.APP_VERSION || "1.0.0";
const START_TIME = Date.now();

// ─── Métricas en memoria (para /metrics en formato Prometheus) ─────
const requestsTotal: Record<string, number> = {};
const latenciesMs: number[] = [];
const MAX_LATENCY_SAMPLES = 1000;

function recordMetric(method: string, path: string, status: number, durationMs: number): void {
  const statusClass = `${Math.floor(status / 100)}xx`;
  const key = `${method}:${path}:${statusClass}`;
  requestsTotal[key] = (requestsTotal[key] ?? 0) + 1;
  latenciesMs.push(durationMs);
  if (latenciesMs.length > MAX_LATENCY_SAMPLES) latenciesMs.shift();
}

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on("finish", () => {
    recordMetric(req.method, req.path, res.statusCode, Date.now() - start);
  });
  next();
});

app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    version: VERSION,
    uptimeSeconds: Math.floor((Date.now() - START_TIME) / 1000),
  });
});

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

app.get("/api/work", async (req: Request, res: Response) => {
  const ms = Number(req.query.ms) || 0;
  const fail = req.query.fail === "true";

  if (ms > 0) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  if (fail) {
    return res.status(500).json({ error: "fallo simulado" });
  }

  return res.status(200).json({ ok: true, ms });
});

app.get("/api/stress", async (req: Request, res: Response) => {
  const connections = Number(req.query.connections) || 10;

  const tasks = Array.from(
    { length: connections },
    () => new Promise((resolve) => setTimeout(resolve, Math.random() * 100))
  );
  await Promise.all(tasks);

  return res.status(200).json({ ok: true, connections });
});

app.get("/metrics", (_req: Request, res: Response) => {
  const lines: string[] = [];

  lines.push("# HELP app_requests_total Total de requests por metodo, ruta y clase de status");
  lines.push("# TYPE app_requests_total counter");
  for (const [key, count] of Object.entries(requestsTotal)) {
    const [method, path, statusClass] = key.split(":");
    lines.push(`app_requests_total{method="${method}",path="${path}",status_class="${statusClass}"} ${count}`);
  }

  const sorted = [...latenciesMs].sort((a, b) => a - b);
  const p95 = sorted.length ? sorted[Math.floor(sorted.length * 0.95)] : 0;
  lines.push("# HELP app_request_latency_p95_ms Latencia p95 en ms (ventana en memoria del proceso)");
  lines.push("# TYPE app_request_latency_p95_ms gauge");
  lines.push(`app_request_latency_p95_ms ${p95}`);

  res.set("Content-Type", "text/plain; version=0.0.4; charset=utf-8");
  res.status(200).send(`${lines.join("\n")}\n`);
});

const PORT = Number(process.env.PORT) || 8080;
/* istanbul ignore next -- arranque real del servidor, no aplica en tests unitarios */
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
  });
}

export default app;
