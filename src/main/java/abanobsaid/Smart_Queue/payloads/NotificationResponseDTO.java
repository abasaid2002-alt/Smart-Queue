package abanobsaid.Smart_Queue.payloads;

import abanobsaid.Smart_Queue.entities.NotificationType;

import java.time.LocalDateTime;

public record NotificationResponseDTO(
        long id,
        String message,
        NotificationType type,
        boolean read,
        LocalDateTime createdAt,
        Long ticketId,
        Integer ticketNumber
) {
}