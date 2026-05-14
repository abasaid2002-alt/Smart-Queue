package abanobsaid.Smart_Queue.payloads;

import abanobsaid.Smart_Queue.entities.QueueStatus;

import java.time.LocalDateTime;

public record QueueResponseDTO(
        long id,
        int currentNumber,
        int lastNumber,
        QueueStatus status,
        LocalDateTime createdAt,
        long businessId,
        String businessName
) {
}