export default async function handler(req, res) {
  const mod = await import("../server/dist/index.js");
  const app = mod.default;
  return app(req, res);
}
