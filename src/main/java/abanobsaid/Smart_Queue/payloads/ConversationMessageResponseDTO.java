package abanobsaid.Smart_Queue.payloads;

import java.time.LocalDateTime;

public record ConversationMessageResponseDTO(
        long id,
        long conversationId,
        long senderId,
        String senderName,
        String body,
        LocalDateTime createdAt
) {
}
