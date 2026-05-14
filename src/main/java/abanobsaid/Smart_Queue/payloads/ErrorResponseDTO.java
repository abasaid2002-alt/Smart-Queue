package abanobsaid.Smart_Queue.payloads;

import java.time.LocalDateTime;

public record ErrorResponseDTO(
        String message,
        LocalDateTime timestamp
) {
}