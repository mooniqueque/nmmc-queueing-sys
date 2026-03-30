import "dotenv/config";
import { db } from "../src/config/database.js";

async function main() {
    const user = await db.user.findFirst({
        where: { name: "Karl Valmores" },
        include: { workstation: true }
    });
    console.log("USER workstationId:", user?.workstationId);
    console.log("USER workstation:", user?.workstation);
}

main().catch(console.error).finally(() => process.exit(0));
