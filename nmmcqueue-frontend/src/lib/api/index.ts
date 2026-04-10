/**
 * Base URL for the Backend API
 * Uses NEXT_PUBLIC_API_URL if defined, otherwise defaults to localhost:3001/api
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
