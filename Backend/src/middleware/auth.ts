import { jwt as jwtPlugin } from "@elysiajs/jwt";
import { HttpError } from "../utils";

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error("JWT_SECRET environment variable is required");
}

export const ACCESS_TOKEN_TTL = "15m";

export const jwtAccess = jwtPlugin({
  name: "jwtAccess",
  secret: jwtSecret,
  exp: ACCESS_TOKEN_TTL,
});

export function signAccessToken(
  jwt: any,
  userId: string,
): Promise<string | null> {
  return jwt.sign({ sub: userId, type: "access" });
}

export const authDerive = ({
  headers,
}: {
  headers: Record<string, string | undefined>;
}) => {
  const auth = headers["authorization"];
  if (!auth?.startsWith("Bearer ")) {
    throw new HttpError(401, "Unauthorized");
  }
  return { bearer: auth.slice(7) };
};

export const authResolve = async ({
  bearer,
  jwtAccess: jwt,
}: {
  bearer: string;
  jwtAccess: any;
}) => {
  let payload: any;
  try {
    payload = await jwt.verify(bearer);
  } catch {
    throw new HttpError(401, "Unauthorized");
  }
  if (!payload) throw new HttpError(401, "Unauthorized");
  if (!payload.sub || typeof payload.sub !== "string") {
    throw new HttpError(401, "Invalid token payload");
  }
  return { userId: payload.sub };
};