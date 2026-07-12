self.addEventListener('push', function(event) {
  if (event.data) {
    try {
      var data = event.data.json();
      var options = {
        body: data.body,
        icon: '/logo.png',
        badge: '/favicon.svg',
        vibrate: [100, 50, 100],
        data: {
          dateOfArrival: Date.now()
        }
      };
      event.waitUntil(
        self.registration.showNotification(data.title, options)
      );
    } catch (e) {
      // Fallback for non-JSON text push data
      var text = event.data.text();
      event.waitUntil(
        self.registration.showNotification('【清瀧神社】通知受信', {
          body: text,
          icon: '/logo.png'
        })
      );
    }
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(function(clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
