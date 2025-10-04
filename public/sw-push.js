// Web Push notification handlers
// This file is imported by the main service worker

console.log('[Push SW] Loading push notification handlers');

// Handle push notifications
self.addEventListener('push', function(event) {
  console.log('[Push SW] Push notification received:', event);

  let notification = {
    title: 'NextBT Notification',
    body: 'You have a new notification',
    icon: '/icons/manifest-icon-192.maskable.png',
    badge: '/icons/manifest-icon-192.maskable.png',
    tag: 'nextbt-notification',
    requireInteraction: false,
    data: {
      url: '/issues'
    }
  };

  // Parse notification data from push event
  if (event.data) {
    try {
      const data = event.data.json();
      console.log('[Push SW] Push data:', data);

      if (data.title) notification.title = data.title;
      if (data.body) notification.body = data.body;
      if (data.icon) notification.icon = data.icon;
      if (data.badge) notification.badge = data.badge;
      if (data.tag) notification.tag = data.tag;
      if (data.url) notification.data.url = data.url;
      if (data.requireInteraction !== undefined) notification.requireInteraction = data.requireInteraction;
    } catch (error) {
      console.error('[Push SW] Error parsing push data:', error);
      // Use text content if JSON parsing fails
      notification.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(notification.title, notification)
      .then(() => console.log('[Push SW] Notification displayed'))
      .catch(err => console.error('[Push SW] Error showing notification:', err))
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', function(event) {
  console.log('[Push SW] Notification clicked:', event.notification.tag);
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/issues';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        // Check if there's already a window/tab open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus().then(() => client.navigate(urlToOpen));
          }
        }
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
      .catch(err => console.error('[Push SW] Error handling notification click:', err))
  );
});

// Handle notification close
self.addEventListener('notificationclose', function(event) {
  console.log('[Push SW] Notification closed:', event.notification.tag);
});

console.log('[Push SW] Push notification handlers loaded');
