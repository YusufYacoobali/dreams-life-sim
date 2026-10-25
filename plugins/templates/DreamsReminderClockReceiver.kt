package __DREAMS_PACKAGE__

import android.app.AlarmManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import androidx.core.app.AlarmManagerCompat
import expo.modules.notifications.notifications.interfaces.SchedulableNotificationTrigger
import expo.modules.notifications.service.NotificationsService
import expo.modules.notifications.service.delegates.ExpoSchedulingDelegate
import kotlin.concurrent.thread

/** Re-arm local wall-clock reminders after a closed-app clock or timezone change. */
class DreamsReminderClockReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent?) {
    if (intent?.action != Intent.ACTION_TIME_CHANGED && intent?.action != Intent.ACTION_TIMEZONE_CHANGED) return
    val pending = goAsync()
    thread {
      try {
        val appContext = context.applicationContext
        val scheduler = ExpoSchedulingDelegate(appContext)
        val alarms = appContext.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        scheduler.getAllScheduledNotifications()
          .filter { it.identifier.startsWith("dreams.daily-reminder.v1.weekday.") }
          .forEach { snapshot ->
            try {
              val identifier = snapshot.identifier
              val current = scheduler.getScheduledNotification(identifier) ?: return@forEach
              if (current.identifier != identifier) return@forEach
              val trigger = current.trigger as? SchedulableNotificationTrigger ?: return@forEach
              val next = trigger.nextTriggerDate() ?: return@forEach
              val operation = NotificationsService.createNotificationTrigger(appContext, identifier)
              // Re-arm only the alarm, never re-save a request from a snapshot.
              // A concurrent opt-out removes the stored request; an obsolete
              // alarm then has nothing to deliver and Expo drops it.
              if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S || alarms.canScheduleExactAlarms()) {
                AlarmManagerCompat.setExactAndAllowWhileIdle(alarms, AlarmManager.RTC_WAKEUP, next.time, operation)
              } else {
                AlarmManagerCompat.setAndAllowWhileIdle(alarms, AlarmManager.RTC_WAKEUP, next.time, operation)
              }
            } catch (error: Exception) {
              Log.w("DreamsReminders", "Could not update a local reminder after a clock change", error)
            }
          }
      } catch (error: Exception) {
        Log.w("DreamsReminders", "Could not load local reminders after a clock change", error)
      } finally {
        pending.finish()
      }
    }
  }
}
