import 'dotenv/config';
import { db } from '../config/database.js';

async function resetQueue() {
    console.log("Resetting Queue Data...");
    await db.visitStatusHistory.deleteMany();
    await db.visitPriorityCategory.deleteMany();
    await db.visit.deleteMany();
    await db.sequence.updateMany({
        data: { value: 0 }
    });
    console.log("Queue Successfully Dropped. Sequence reset to 0!");
}

resetQueue().catch(e => console.error(e)).finally(() => db.$disconnect());
