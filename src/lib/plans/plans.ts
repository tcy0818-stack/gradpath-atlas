// Prototype pricing (PRD 1.6). Hypothetical: nothing is charged and no limit below is enforced.
export const SELECTABLE_PLANS = ["free", "season_pass"] as const;
export type SelectablePlan = (typeof SELECTABLE_PLANS)[number];
export const PLAN_LABELS = { free: "Free", season_pass: "Season pass", licence_enquiry: "Adviser / university licence" } as const;
export const isSelectablePlan = (v: unknown): v is SelectablePlan => (SELECTABLE_PLANS as readonly unknown[]).includes(v);
