import { db } from "@/db";
import { systemLogs } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export type LogSeverity = "critical" | "warning" | "info";
export type LogCategory = "payment" | "email" | "check_in" | "legal" | "system";

export interface LogEventParams {
  severity: LogSeverity;
  category: LogCategory;
  message: string;
  details?: string | null;
  relatedEntityId?: string | null;
}

/**
 * Asynchronously logs a system event/error to the database.
 * Designed to never throw errors so it won't interrupt core user flows.
 */
export async function logSystemEvent(params: LogEventParams): Promise<void> {
  const { severity, category, message, details, relatedEntityId } = params;

  try {
    const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    await db.insert(systemLogs).values({
      id: logId,
      severity,
      category,
      message,
      details: details || null,
      relatedEntityId: relatedEntityId || null,
      createdAt: new Date(),
    });

    if (severity === "critical") {
      console.error(`[CRITICAL SYSTEM LOG] [${category.toUpperCase()}] ${message}`, details || "");
    } else if (severity === "warning") {
      console.warn(`[WARNING SYSTEM LOG] [${category.toUpperCase()}] ${message}`, details || "");
    } else {
      console.log(`[INFO SYSTEM LOG] [${category.toUpperCase()}] ${message}`);
    }
  } catch (err) {
    console.error("[SYSTEM LOGGER FAILURE] Failed to write log to DB:", err);
  }
}

export interface SystemHealthOverview {
  status: "operational" | "warning" | "critical";
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  totalCount: number;
}

/**
 * Calculates system health metrics based on recent log entries (last 24 hours / total).
 */
export async function getSystemHealthOverview(): Promise<SystemHealthOverview> {
  try {
    const allLogs = await db.select().from(systemLogs);

    const criticalCount = allLogs.filter((l) => l.severity === "critical").length;
    const warningCount = allLogs.filter((l) => l.severity === "warning").length;
    const infoCount = allLogs.filter((l) => l.severity === "info").length;

    let status: "operational" | "warning" | "critical" = "operational";
    if (criticalCount > 0) {
      status = "critical";
    } else if (warningCount > 0) {
      status = "warning";
    }

    return {
      status,
      criticalCount,
      warningCount,
      infoCount,
      totalCount: allLogs.length,
    };
  } catch (err) {
    console.error("[HEALTH OVERVIEW ERROR]", err);
    return {
      status: "warning",
      criticalCount: 0,
      warningCount: 0,
      infoCount: 0,
      totalCount: 0,
    };
  }
}
