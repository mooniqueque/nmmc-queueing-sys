import { auth } from "@/lib/database/auth";
import { toNextJsHandler } from "better-auth/next-js";

//auth methods
export const { GET, POST } = toNextJsHandler(auth);