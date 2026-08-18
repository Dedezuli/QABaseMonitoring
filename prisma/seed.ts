import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@qaweekly.local" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@qaweekly.local",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  });

  const qaPassword = await bcrypt.hash("qa123456", 10);
  const qa = await prisma.user.upsert({
    where: { email: "qa@qaweekly.local" },
    update: {},
    create: {
      name: "QA Demo",
      email: "qa@qaweekly.local",
      passwordHash: qaPassword,
      role: "QA",
    },
  });

  const demoProjects = [
    {
      id: "demo-project-cms",
      name: "CMS",
      code: "CMS",
      description: "Content management system internal.",
    },
    {
      id: "demo-project-esg",
      name: "ESG",
      code: "ESG",
      description: "Platform pelaporan ESG.",
    },
    {
      id: "demo-project-iss",
      name: "ISS",
      code: "ISS",
      description: "Internal support system.",
    },
  ];

  const projects = [];
  for (const p of demoProjects) {
    const project = await prisma.project.upsert({
      where: { id: p.id },
      update: {},
      create: {
        id: p.id,
        name: p.name,
        code: p.code,
        description: p.description,
        startDate: new Date(),
        status: "ACTIVE",
      },
    });
    projects.push(project);

    await prisma.projectAssignment.upsert({
      where: { projectId_userId: { projectId: project.id, userId: qa.id } },
      update: {},
      create: { projectId: project.id, userId: qa.id },
    });
  }

  function mondayOfWeeksAgo(weeksAgo: number) {
    const now = new Date();
    const day = now.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(now.getDate() + diffToMonday - weeksAgo * 7);
    return monday;
  }

  const statusRotation = ["SUBMITTED", "NEED_REVISION", "APPROVED"] as const;

  const existingReportCount = await prisma.weeklyReport.count();
  if (existingReportCount === 0) {
    let i = 0;
    for (let weeksAgo = 0; weeksAgo < 3; weeksAgo++) {
      const weekStart = mondayOfWeeksAgo(weeksAgo);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 4);

      for (const project of projects) {
        const status = statusRotation[i % statusRotation.length];
        i++;

        await prisma.weeklyReport.create({
          data: {
            projectId: project.id,
            userId: qa.id,
            weekStart,
            weekEnd,
            summary: `Regression testing & bug verification untuk ${project.name} minggu ini.`,
            blocker: "",
            nextWeekPlan: `Lanjut regression testing ${project.name} untuk modul berikutnya.`,
            totalTestCase: 40,
            totalTcBE: 20,
            totalTcBEAutomated: 12,
            totalTcBEPassed: 10,
            totalTcBEFailed: 2,
            totalTcFE: 20,
            totalTcFEAutomated: 8,
            totalTcFEPassed: 7,
            totalTcFEFailed: 1,
            productionIncidentCount: weeksAgo === 0 ? 1 : 0,
            bugDocumentUrl: weeksAgo === 0 ? "https://bugtracker.example.com/sheet" : null,
            status,
            reviewNote: status === "NEED_REVISION" ? "Mohon lengkapi detail langkah reproduce bug." : null,
            reviewedById: status === "NEED_REVISION" || status === "APPROVED" ? admin.id : null,
            reviewedAt: status === "NEED_REVISION" || status === "APPROVED" ? new Date() : null,
            coAuthors: { create: [{ userId: qa.id, approved: true, approvedAt: new Date() }] },
            bugs:
              weeksAgo === 0
                ? {
                    create: [
                      {
                        title: `Bug production ${project.code}-101`,
                        description: "Ditemukan saat regression testing.",
                      },
                    ],
                  }
                : undefined,
          },
        });
      }
    }
  }

  console.log("Seed selesai.");
  console.log("Login admin: admin@qaweekly.local / admin123");
  console.log("Login QA   : qa@qaweekly.local / qa123456");
  void admin;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
