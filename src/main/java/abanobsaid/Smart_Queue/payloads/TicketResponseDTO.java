package abanobsaid.Smart_Queue.payloads;

import abanobsaid.Smart_Queue.entities.TicketStatus;

import java.time.LocalDateTime;

public record TicketResponseDTO(
        long id,
        int ticketNumber,
        TicketStatus status,
        LocalDateTime createdAt,
        LocalDateTime calledAt,
        LocalDateTime completedAt,
        boolean smartDelayUsed,
        LocalDateTime smartDelayAt,
        int sortOrder,
        long queueId,
        long businessId,
        String businessName,
        long userId,
        String userName,
        int currentNumber,
        int peopleBefore,
        boolean canCancel,
        boolean canSmartDelay,
        boolean canUndoFinalization
) {
}