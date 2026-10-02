function getMissedDosesInWindow(ctx, hours) {
    const windowMs = hours * 60 * 60 * 1000;
    const cutoff = new Date(ctx.now.getTime() - windowMs);
    return ctx.doses
        .filter((d) => d.status === "MISSED")
        .filter((d) => d.dueAt >= cutoff && d.dueAt <= ctx.now)
        .map((d) => ({
        id: d.id,
        dueAt: d.dueAt,
        medicationName: d.medicationName,
    }));
}
function formatExamples(missed, max = 3) {
    return missed.slice(0, max).map((m) => ({
        dueAt: m.dueAt.toISOString(),
        medicationName: m.medicationName,
    }));
}
export const medSingleMissRule = {
    id: "MED_SINGLE_MISS",
    evaluate(ctx, config) {
        const missed24h = getMissedDosesInWindow(ctx, config.missedDose.singleMissWindowHours);
        const n = missed24h.length;
        if (n === config.missedDose.singleMissCount) {
            const evidence = {
                n,
                windowHours: config.missedDose.singleMissWindowHours,
                missed: formatExamples(missed24h),
            };
            return {
                ruleId: this.id,
                level: "LOW",
                text: "1 medication dose missed in the last 24 hours.",
                evidence,
            };
        }
        return null;
    },
};
export const medRepeatedMissRule = {
    id: "MED_REPEATED_MISS",
    evaluate(ctx, config) {
        const missed24h = getMissedDosesInWindow(ctx, 24);
        const missed72h = getMissedDosesInWindow(ctx, 72);
        const n24 = missed24h.length;
        const n72 = missed72h.length;
        let triggered = false;
        let windowHours = null;
        let n = null;
        let missedExamples = [];
        if (n24 >= config.missedDose.repeatedMiss24hCount) {
            triggered = true;
            windowHours = 24;
            n = n24;
            missedExamples = formatExamples(missed24h);
        }
        else if (n72 >= config.missedDose.repeatedMiss72hCount) {
            triggered = true;
            windowHours = 72;
            n = n72;
            missedExamples = formatExamples(missed72h);
        }
        if (!triggered || n === null || windowHours === null) {
            return null;
        }
        const evidence = {
            n,
            windowHours,
            missed24hCount: n24,
            missed72hCount: n72,
            missed: missedExamples,
        };
        return {
            ruleId: this.id,
            level: "MEDIUM",
            text: `${n} medication doses missed in the last ${windowHours} hours.`,
            evidence,
        };
    },
};
