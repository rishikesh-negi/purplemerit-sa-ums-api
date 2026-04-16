import crypto from "crypto";
import jwt, { type JwtPayload, type Secret } from "jsonwebtoken";
import ms from "ms";
import { promisify } from "util";
import type { AuthJWTPayload } from "../types/types.js";

const getJwtEnvVars = () => {
  const ACCESS_JWT_SECRET: string = process.env["ACCESS_JWT_SECRET"]!;
  const REFRESH_JWT_SECRET: string = process.env["REFRESH_JWT_SECRET"]!;

  const REFRESH_JWT_EXPIRES_IN: string = process.env["REFRESH_JWT_EXPIRES_IN"]!;
  const ACCESS_JWT_EXPIRES_IN: string = process.env["ACCESS_JWT_EXPIRES_IN"]!;

  return { ACCESS_JWT_SECRET, REFRESH_JWT_SECRET, ACCESS_JWT_EXPIRES_IN, REFRESH_JWT_EXPIRES_IN };
};

export function signAuthJWT(payload: AuthJWTPayload, tokenType: "access" | "refresh") {
  const { ACCESS_JWT_SECRET, REFRESH_JWT_SECRET, ACCESS_JWT_EXPIRES_IN, REFRESH_JWT_EXPIRES_IN } =
    getJwtEnvVars();
  const jwtSecret: Secret = tokenType === "access" ? ACCESS_JWT_SECRET : REFRESH_JWT_SECRET;
  const expiresIn: ms.StringValue = (
    tokenType === "access" ? ACCESS_JWT_EXPIRES_IN : REFRESH_JWT_EXPIRES_IN
  ) as ms.StringValue;

  return jwt.sign(payload, jwtSecret, {
    expiresIn,
  });
}

export async function verifyAuthJWT(
  token: string,
  type: "access" | "refresh",
): Promise<AuthJWTPayload> {
  const { ACCESS_JWT_SECRET, REFRESH_JWT_SECRET } = getJwtEnvVars();
  const SECRET = type === "access" ? ACCESS_JWT_SECRET : REFRESH_JWT_SECRET;

  // Promisifying JWT verification to free up Node.js event loop:
  const verifyAsync = promisify(jwt.verify as (token: string, secret: string) => JwtPayload);
  const decoded = (await verifyAsync(token, SECRET)) as AuthJWTPayload;

  return decoded;
}

export function createRefreshToken(payload: AuthJWTPayload) {
  const { REFRESH_JWT_EXPIRES_IN } = getJwtEnvVars();
  const refreshToken = signAuthJWT(payload, "refresh");
  const refreshTokenExpiry: Date = new Date(
    Date.now() + Number.parseInt(REFRESH_JWT_EXPIRES_IN) * 24 * 60 * 60 * 1000,
  );

  const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

  return { refreshToken, tokenHash, refreshTokenExpiry };
}

export function createAccessToken(payload: AuthJWTPayload) {
  const { ACCESS_JWT_EXPIRES_IN } = getJwtEnvVars();
  const accessToken = signAuthJWT(payload, "access");
  const accessTokenExpiry: Date = new Date(
    Date.now() + Number.parseInt(ACCESS_JWT_EXPIRES_IN) * 60 * 1000,
  );
  return { accessToken, accessTokenExpiry };
}
