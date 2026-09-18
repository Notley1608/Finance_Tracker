import { Elysia, t } from "elysia";
import { databasePlugin } from "../plugins/database";
import { jwtAccess, authDerive, authResolve } from "../middleware/auth";
import { HttpError } from "../utils";
import { parseReceipt } from "../utils/receiptParser";
import { getCategoriesByUser } from "../utils/receiptCategories";
import { extractTextFromReceipt } from "../utils/receiptOcr";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export const importRoutes = new Elysia({ prefix: "/imports" })
  .use(databasePlugin)
  .use(jwtAccess)
  .derive(authDerive)
  .resolve(authResolve)
  .post(
    "/receipt",
    async ({ body, userId, db, set }) => {
      if (!body?.file) throw new HttpError(400, "receipt file is required");
      const { file } = body;
      if (file.size > MAX_UPLOAD_BYTES) {
        throw new HttpError(413, "Receipt exceeds 10MB upload limit");
      }
      const text = await extractTextFromReceipt(file);
      const categoryNames = await getCategoriesByUser(db, userId);
      const result = parseReceipt(text.text, { categoryNames });
      if (result.lines.length === 0 && result.total === null) {
        throw new HttpError(422, "Could not extract any items — upload a clearer scan or a PDF with selectable text");
      }
      set.headers["Cache-Control"] = "no-store";
      return result;
    },
    {
      body: t.Object({
        file: t.File({ maxSize: MAX_UPLOAD_BYTES }),
      }),
      type: "multipart/form-data",
    },
  );
