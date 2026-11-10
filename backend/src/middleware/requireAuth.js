import jwt from "jsonwebtoken";

export default function requireAuth(req, res, next) {
  const authorization = req.get("authorization");
  const [scheme, token] = authorization?.split(" ") ?? [];

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Please sign in to continue." });
  }

  try {
    const payload = jwt.verify(token, process.env.JSON_SECRET);

    if (typeof payload === "string" || typeof payload.sub !== "string") {
      return res.status(401).json({ message: "Your session is invalid." });
    }

    req.userId = payload.sub;
    return next();
  } catch {
    return res.status(401).json({ message: "Your session has expired. Please sign in again." });
  }
}
