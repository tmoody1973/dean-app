import { defineSchedule } from "eve/schedules";

export const REVIEW_CHECK_IN_CRON = "*/30 * * * *";

export default defineSchedule({
  cron: REVIEW_CHECK_IN_CRON,
  markdown:
    "Prepare Dean's scheduled review check-in for the public demo. This task intentionally has no browser delivery target: it demonstrates the same follow-up prompt that a parked tutor would receive, but must not claim a learner was contacted. Keep the output to one practical question that invites the learner to resume the module already on screen.",
});
