"use server";
import { revalidatePath } from "next/cache";
import * as monitorApi from "./api";
import { getServerHeaders } from "@/lib/api/server";

export async function uploadVideo(departmentId: string, videoFile: File) {
    // Note: Standard Next.js server actions handle file uploads via FormData automatically if passed from a form
    // However, since we're using a specific backend route, we'll proxy it.
    const result = await monitorApi.uploadMonitorVideo(departmentId, videoFile, {
        headers: await getServerHeaders(),
    });
    if (result.success) {
        revalidatePath("/admin-monisetting");
        revalidatePath("/monitor"); // Revalidate public monitor routes if they exist
    }
    return result;
}

export async function getDepartmentsVideos() {
    return monitorApi.getDepartmentsVideos({
        headers: await getServerHeaders(),
    });
}
