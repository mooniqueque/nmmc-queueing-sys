export const dynamic = 'force-dynamic';

import { redirect } from "next/navigation";

export default function WorkstationsPage() {
    redirect("/admin-departments");
}
