/** Application lifecycle statuses (aligned with MongoDB schema enum) */
export const APPLICATION_STATUSES = [
    "Applied",
    "Shortlisted",
    "Interview Scheduled",
    "Pending Decision",
    "Selected",
    "Rejected",
];

/** Statuses a company may set via API (system sets Pending Decision) */
export const COMPANY_SETTABLE_STATUSES = APPLICATION_STATUSES.filter(
    (s) => s !== "Pending Decision"
);
