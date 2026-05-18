package abanobsaid.Smart_Queue.payloads;

import abanobsaid.Smart_Queue.entities.TicketStatus;

public record WaitingInfoResponseDTO(
        long ticketId,
        int ticketNumber,
        TicketStatus status,
        int position,
        int peopleBefore,
        int averageServiceMinutes,
        int estimatedWaitingMinutes
) {
}