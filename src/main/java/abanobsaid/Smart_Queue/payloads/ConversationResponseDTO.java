package abanobsaid.Smart_Queue.payloads;

import java.time.LocalDateTime;

public record ConversationResponseDTO(
        long id,
        long businessId,
        String businessName,
        Long ticketId,
        Integer ticketNumber,
        long customerId,
        String customerName,
        long managerId,
        String managerName,
        String lastMessage,
        LocalDateTime lastMessageAt
) {
}
