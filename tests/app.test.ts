import request from "supertest";
import app from "../src/index";

describe("GET /", () => {
  it("responde 200 con status y version", async () => {
    const res = await request(app).get("/");
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.version).toBeDefined();
  });
});

describe("GET /health", () => {
  it("responde 200 con status ok", async () => {
    const res = await request(app).get("/health");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});

describe("GET /api/greet", () => {
  it("saluda con el nombre por defecto", async () => {
    const res = await request(app).get("/api/greet");
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Hola, mundo!");
  });

  it("saluda con el nombre dado", async () => {
    const res = await request(app).get("/api/greet?name=Santiago");
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Hola, Santiago!");
  });
});

describe("POST /api/sum", () => {
  it("suma dos numeros", async () => {
    const res = await request(app).post("/api/sum").send({ a: 2, b: 3 });
    expect(res.statusCode).toBe(200);
    expect(res.body.result).toBe(5);
  });

  it("rechaza entradas invalidas", async () => {
    const res = await request(app).post("/api/sum").send({ a: "x", b: 3 });
    expect(res.statusCode).toBe(400);
  });

  it("rechaza cuando b no es numero", async () => {
    const res = await request(app).post("/api/sum").send({ a: 2, b: "y" });
    expect(res.statusCode).toBe(400);
  });

  it("rechaza cuando no se envia body", async () => {
    const res = await request(app).post("/api/sum");
    expect(res.statusCode).toBe(400);
  });
});

describe("GET /api/work", () => {
  it("responde 200 sin fail", async () => {
    const res = await request(app).get("/api/work?ms=10");
    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("responde 500 cuando fail=true", async () => {
    const res = await request(app).get("/api/work?ms=10&fail=true");
    expect(res.statusCode).toBe(500);
  });
});

describe("GET /api/stress", () => {
  it("responde 200 tras resolver las conexiones simuladas", async () => {
    const res = await request(app).get("/api/stress?connections=5");
    expect(res.statusCode).toBe(200);
    expect(res.body.connections).toBe(5);
  });
});

describe("GET /metrics", () => {
  it("responde 200 en formato Prometheus", async () => {
    await request(app).get("/health");
    const res = await request(app).get("/metrics");
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toContain("text/plain");
    expect(res.text).toContain("app_requests_total");
  });
});
