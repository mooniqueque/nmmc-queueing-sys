import { Prisma } from "@prisma/client";

export type VisitWithPatient = Prisma.VisitGetPayload<{
    include: { patient: true }
}>;
