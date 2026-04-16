import type { NextFunction, Request, Response } from "express";
import sanitizeHtml from "sanitize-html";

function sanitizeValue(value: unknown): unknown {
  if (typeof value === "string") {
    return sanitizeHtml(value, {
      allowedTags: [],
      allowedAttributes: {},
    }).trim();
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value && typeof value === "object" && Object.keys(value).length > 0) {
    const sanitized: Record<string, unknown> = {};
    for (const key in value as Record<string, unknown>) {
      const cleanKey = key.replace(/[$.]/g, "").trim();
      if (cleanKey.length === 0) continue;
      sanitized[cleanKey] = sanitizeValue((value as Record<string, unknown>)[key]);
    }

    return sanitized;
  }

  return value;
}

export function sanitizeRequest(req: Request<unknown>, _res: Response, next: NextFunction) {
  if (req.body) req.body = sanitizeValue(req.body);
  if (req.params) req.params = sanitizeValue(req.params);
  next();
}
