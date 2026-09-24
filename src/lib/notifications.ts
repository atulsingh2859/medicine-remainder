import { Medication } from '@/types/medication';

let notificationPermission: NotificationPermission = 'default';

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    notificationPermission = 'granted';
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    notificationPermission = permission;
    return permission === 'granted';
  }

  return false;
};

export const showNotification = (title: string, body: string, icon?: string): void => {
  if (notificationPermission === 'granted') {
    new Notification(title, {
      body,
      icon: icon || '/favicon.svg',
      badge: '/favicon.svg',
      tag: 'medicine-reminder',
      requireInteraction: true
    });
  }
};

export const checkAndNotifyUpcomingMedications = (medications: Medication[]): void => {
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  medications.forEach(med => {
    if (med.isActive) {
      med.times.forEach(time => {
        // Check if medication time matches current time (within 1 minute)
        if (time === currentTime) {
          showNotification(
            'Medicine Reminder',
            `Time to take ${med.name} - ${med.dosage}`,
            '/favicon.svg'
          );
        }
      });
    }
  });
};

export const scheduleNotificationCheck = (medications: Medication[]): NodeJS.Timeout => {
  // Check every minute for upcoming medications
  return setInterval(() => {
    checkAndNotifyUpcomingMedications(medications);
  }, 60000); // Check every 60 seconds
};

export const getNotificationStatus = (): NotificationPermission => {
  if ('Notification' in window) {
    return Notification.permission;
  }
  return 'denied';
};