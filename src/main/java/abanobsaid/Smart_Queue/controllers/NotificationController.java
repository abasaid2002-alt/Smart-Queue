package abanobsaid.Smart_Queue.controllers;

import abanobsaid.Smart_Queue.entities.Notification;
import abanobsaid.Smart_Queue.entities.User;
import abanobsaid.Smart_Queue.payloads.NotificationResponseDTO;
import abanobsaid.Smart_Queue.services.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @GetMapping("/notifications/my")
    public List<NotificationResponseDTO> getMyNotifications(@AuthenticationPrincipal User currentUser) {
        return notificationService.getMyNotifications(currentUser)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @GetMapping("/notifications/my/unread")
    public List<NotificationResponseDTO> getMyUnreadNotifications(@AuthenticationPrincipal User currentUser) {
        return notificationService.getMyUnreadNotifications(currentUser)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @PatchMapping("/notifications/{notificationId}/read")
    public NotificationResponseDTO markAsRead(
            @PathVariable long notificationId,
            @AuthenticationPrincipal User currentUser
    ) {
        Notification notification = notificationService.markAsRead(notificationId, currentUser);
        return toResponse(notification);
    }

    private NotificationResponseDTO toResponse(Notification notification) {
        Long ticketId = null;
        Integer ticketNumber = null;

        if (notification.getTicket() != null) {
            ticketId = notification.getTicket().getId();
            ticketNumber = notification.getTicket().getTicketNumber();
        }

        return new NotificationResponseDTO(
                notification.getId(),
                notification.getMessage(),
                notification.getType(),
                notification.isRead(),
                notification.getCreatedAt(),
                ticketId,
                ticketNumber
        );
    }
}