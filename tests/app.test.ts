import request from "supertest";
import app from "../src/index";

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
