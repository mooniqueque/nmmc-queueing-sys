/**
 * Base URL for the Backend API
 * Fail loudly in production if NEXT_PUBLIC_API_URL is missing.
 */
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

if (!apiUrl) {
	throw new Error("CRITICAL: NEXT_PUBLIC_API_URL is missing");
}

export const API_URL = apiUrl;

export { apiClient, ApiClientError } from "./api-client";

