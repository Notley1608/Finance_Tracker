import { jwt as jwtPlugin } from "@elysiajs/jwt";
import { HttpError } from "../utils";

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error("JWT_SECRET environment variable is required");
}

export const jwtMiddleware = jwtPlugin({
  name: "jwt",
  secret: jwtSecret,
  exp: "7d",
});

export const authDerive = ({ headers }: { headers: Record<string, string | undefined> }) => {
  const auth = headers["authorization"];
  if (!auth?.startsWith("Bearer ")) {
    throw new HttpError(401, "Unauthorized");
  }
  return { bearer: auth.slice(7) };
};

export const authResolve = async ({
  bearer,
  jwt,
}: {
  bearer: string;
  jwt: any;
}) => {
  let payload;
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
