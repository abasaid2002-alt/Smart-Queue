package abanobsaid.Smart_Queue.payloads;

import abanobsaid.Smart_Queue.entities.TicketStatus;

import java.time.LocalDateTime;

public record TicketResponseDTO(
        long id,
        int ticketNumber,
        TicketStatus status,
        LocalDateTime createdAt,
        LocalDateTime servedAt,
        long queueId,
        long businessId,
        String businessName,
        long userId,
        String userName,
        int currentNumber,
        int peopleBefore
) {
}