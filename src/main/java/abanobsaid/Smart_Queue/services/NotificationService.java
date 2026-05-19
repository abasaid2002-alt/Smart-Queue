package abanobsaid.Smart_Queue.services;

import abanobsaid.Smart_Queue.entities.*;
import abanobsaid.Smart_Queue.repositories.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    public Notification createNotification(User user, Ticket ticket, NotificationType type, String message) {
        Notification notification = new Notification(user, ticket, type, message);
        return notificationRepository.save(notification);
    }

    public List<Notification> getMyNotifications(User currentUser) {
        return notificationRepository.findByUserOrderByCreatedAtDesc(currentUser);
    }

    public List<Notification> getMyUnreadNotifications(User currentUser) {
        return notificationRepository.findByUserAndReadFalseOrderByCreatedAtDesc(currentUser);
    }

    public Notification markAsRead(long notificationId, User currentUser) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notifica non trovata"));

        if (notification.getUser().getId() != currentUser.getId()) {
            throw new RuntimeException("Non puoi modificare questa notifica");
        }

        notification.setRead(true);

        return notificationRepository.save(notification);
    }
}