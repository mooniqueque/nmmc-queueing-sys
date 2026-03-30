import "dotenv/config";
import { db } from "../src/config/database.js";

async function main() {
    let ws = await db.workStation.findFirst({ where: { type: "TRIAGE" } });
    if (!ws) {
        ws = await db.workStation.create({
            data: {
                name: "Entrance Triage 1",
                type: "TRIAGE",
                stationNo: 1,
            }
        });
        console.log("Created workstation:", ws.name);
    }
    
    await db.user.updateMany({
        where: { name: "Karl Valmores" },
        data: { workstationId: ws.id }
    });
    console.log("Assigned", ws.name, "to Karl Valmores.");
}

main().catch(console.error).finally(() => process.exit(0));
