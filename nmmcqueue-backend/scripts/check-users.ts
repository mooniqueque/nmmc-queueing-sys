
import { db } from '../src/config/database';

async function checkSync() {
    try {
        const users = await db.user.count();
        const depts = await db.department.findMany({ select: { name: true } });
        const stations = await db.workStation.findMany({ select: { name: true } });
        
        console.log(JSON.stringify({
            users,
            depts: depts.map(d => d.name),
            stations: stations.map(s => s.name)
        }, null, 2));
    } catch (err) {
        console.error("Diagnostic error:", err);
    } finally {
        await db.$disconnect();
    }
}

checkSync();
