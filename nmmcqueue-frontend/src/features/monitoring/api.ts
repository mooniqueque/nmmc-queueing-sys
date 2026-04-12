import { API_URL } from "@/lib/api";

export async function uploadMonitorVideo(departmentId: string, videoFile: File, options?: RequestInit) {
    const formData = new FormData();
    formData.append('departmentId', departmentId);
    formData.append('video', videoFile);

    const res = await fetch(`${API_URL}/monitor/upload-video`, {
        method: 'POST',
        ...options,
        body: formData,
        // Fetch will automatically set the correct Content-Type with boundary for FormData
    });

    if (!res.ok) {
        const text = await res.text();
        return { success: false, error: text || 'Upload failed' };
    }

    return res.json();
}

export async function getDepartmentsVideos(options?: RequestInit) {
    const url = `${API_URL}/monitor/departments-videos`;
    try {
        const res = await fetch(url, options);
        if (!res.ok) {
            const text = await res.text();
            console.error(`[API] Fetch failed (${res.status}): ${text}`);
            return { success: false, data: [], error: text };
        }
        return await res.json();
    } catch (error) {
        console.error(`[API] Fetch error:`, error);
        return { success: false, data: [], error: String(error) };
    }
}
