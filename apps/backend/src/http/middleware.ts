import type { NextFunction, Request, Response } from "express";

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Resource not found" } });
}

export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  const message = err instanceof Error ? err.message : "Internal server error";
  res.status(500).json({ error: { code: "INTERNAL_SERVER_ERROR", message } });
}
