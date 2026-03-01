import { getDepartments } from "@/app/actions/department-actions";
import { Department } from "@/types/models";
import { connection } from "next/server";
import { SignupForm } from "../../_components/signup-form";

export default async function SignupData() {
    await connection();

    let departments: Department[] = [];
    try {
        const response = await getDepartments();
        departments = response.success ? response.data : [];
    } catch {
        // Build-time handle
    }

    return <SignupForm departments={departments as Department[]} />;
}
