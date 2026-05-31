/**
 * =============================================================================
 * FireGuard LTD — Daily Notification Cron Job
 * =============================================================================
 * Schedules the automated alert pipeline using node-cron.
 * Default schedule: every day at 08:00 (configurable via CRON_SCHEDULE env).
 *
 * The cron delegates all business logic to notification.service.ts so this
 * file stays focused on scheduling concerns only.
 * =============================================================================
 */

import cron from 'node-cron';
import { runDailyNotificationCron } from '../services/notification.service';

/** Guard flag — prevents double-scheduling if startCronJob is called twice. */
let cronStarted = false;

/**
 * Register the daily cron job and log the active schedule.
 * Safe to call once during server bootstrap (app.ts).
 */
export function startCronJob(): void {
  if (cronStarted) {
    console.warn('[Cron] Job already scheduled — skipping duplicate registration');
    return;
  }

  const schedule = process.env.CRON_SCHEDULE || '0 8 * * *';

  // Validate cron expression before scheduling
  if (!cron.validate(schedule)) {
    console.error(`[Cron] Invalid CRON_SCHEDULE "${schedule}" — using default 0 8 * * *`);
  }

  const activeSchedule = cron.validate(schedule) ? schedule : '0 8 * * *';

  console.log(`[Cron] Scheduling daily notification job: "${activeSchedule}"`);

  cron.schedule(activeSchedule, async () => {
    console.log(`[Cron] Triggered at ${new Date().toISOString()}`);
    try {
      const result = await runDailyNotificationCron();
      console.log('[Cron] Job finished successfully:', JSON.stringify(result));
    } catch (error) {
      console.error('[Cron] Job failed with unhandled error:', error);
    }
  });

  cronStarted = true;
}
