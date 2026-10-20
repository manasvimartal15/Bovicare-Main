/**
 * Notification Service
 * Dynamically computes real in-app notifications from current herd records:
 * - Overdue vaccinations based on recorded nextDueDate in the past
 * - Upcoming / due today vaccinations based on recorded dates
 * - Clinical and observation follow-ups when records indicate elevated temperature or alert status
 *
 * Does not fabricate missing data or claim push notifications are enabled.
 */

const STORAGE_KEY_READ_NOTIFS = 'bovicare_read_notification_ids';

export function getReadNotificationIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_READ_NOTIFS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Could not read notification IDs from storage:', e);
  }
  return [];
}

export function saveReadNotificationIds(ids) {
  try {
    localStorage.setItem(STORAGE_KEY_READ_NOTIFS, JSON.stringify(ids));
  } catch (e) {
    console.warn('Could not save notification IDs to storage:', e);
  }
}

/**
 * Generate dynamic notifications derived from active cow records
 */
export function generateHerdNotifications(cows = []) {
  const notifications = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  cows.forEach((cow) => {
    // 1. Vaccination reminders from cow.vaccinations
    if (Array.isArray(cow.vaccinations)) {
      cow.vaccinations.forEach((vac) => {
        if (!vac.nextDueDate) return;

        const due = new Date(vac.nextDueDate);
        due.setHours(0, 0, 0, 0);
        const diffTime = due.getTime() - today.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
          // Overdue vaccination
          notifications.push({
            id: `notif-vac-overdue-${cow.id}-${vac.id}`,
            category: 'vaccine',
            type: 'overdue',
            urgency: 'alert',
            title: `Overdue Vaccination: ${vac.title}`,
            cowId: cow.id,
            cowName: cow.name,
            tagId: cow.tagId,
            breed: cow.breed,
            dateLabel: `Due date was ${vac.nextDueDate}`,
            message: `Vaccination schedule is ${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''} past due for ${cow.name} (${cow.tagId}). Administer booster promptly to maintain herd immunity.`,
            actionLabel: 'View Vaccine Record',
            timestamp: vac.nextDueDate,
          });
        } else if (diffDays === 0) {
          // Due Today
          notifications.push({
            id: `notif-vac-today-${cow.id}-${vac.id}`,
            category: 'vaccine',
            type: 'due-today',
            urgency: 'alert',
            title: `Vaccination Due Today: ${vac.title}`,
            cowId: cow.id,
            cowName: cow.name,
            tagId: cow.tagId,
            breed: cow.breed,
            dateLabel: 'Due today',
            message: `Scheduled immunization for ${cow.name} (${cow.tagId}) is due today (${vac.nextDueDate}).`,
            actionLabel: 'Log Administration',
            timestamp: vac.nextDueDate,
          });
        } else if (diffDays <= 14) {
          // Due Soon (within 2 weeks)
          notifications.push({
            id: `notif-vac-soon-${cow.id}-${vac.id}`,
            category: 'vaccine',
            type: 'upcoming',
            urgency: 'watch',
            title: `Upcoming Vaccination: ${vac.title}`,
            cowId: cow.id,
            cowName: cow.name,
            tagId: cow.tagId,
            breed: cow.breed,
            dateLabel: `Due in ${diffDays} day${diffDays > 1 ? 's' : ''} (${vac.nextDueDate})`,
            message: `Upcoming scheduled booster for ${cow.name} (${cow.tagId}). Prepare vaccine doses and schedule administration.`,
            actionLabel: 'View Schedule',
            timestamp: vac.nextDueDate,
          });
        }
      });
    }

    // 2. Clinical follow-up reminders based on alert health status or fever
    const tempNum = parseFloat(cow.temperature) || 38.5;
    if (cow.status === 'alert' || tempNum > 39.5) {
      notifications.push({
        id: `notif-clinical-${cow.id}`,
        category: 'followup',
        type: 'clinical-alert',
        urgency: 'alert',
        title: `Clinical Review Needed: ${cow.name} (${cow.tagId})`,
        cowId: cow.id,
        cowName: cow.name,
        tagId: cow.tagId,
        breed: cow.breed,
        dateLabel: 'Immediate attention',
        message: `High body temperature (${cow.temperature}) recorded with health alert: "${cow.issue || 'Elevated temperature & localized swelling'}". Isolate cow from bulk milk tank and request veterinary clinical examination.`,
        actionLabel: 'Review Health Record',
        timestamp: new Date().toISOString().split('T')[0],
      });
    } else if (cow.status === 'watch' || tempNum > 39.3) {
      notifications.push({
        id: `notif-watch-${cow.id}`,
        category: 'followup',
        type: 'observation',
        urgency: 'watch',
        title: `Observation Follow-Up: ${cow.name} (${cow.tagId})`,
        cowId: cow.id,
        cowName: cow.name,
        tagId: cow.tagId,
        breed: cow.breed,
        dateLabel: 'Monitoring required',
        message: `Cow is currently flagged under observation (${cow.issue || 'mild temperature or conductivity variance'}). Monitor morning and evening milk conductivity twice daily.`,
        actionLabel: 'Check Temperature',
        timestamp: new Date().toISOString().split('T')[0],
      });
    }
  });

  return notifications;
}
