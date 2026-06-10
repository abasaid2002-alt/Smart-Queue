package abanobsaid.Smart_Queue.payloads;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ConversationMessageRequestDTO(
        @JsonAlias({"message", "content", "text"})
        @NotBlank(message = "Il messaggio non può essere vuoto")
        @Size(max = 1000, message = "Il messaggio può contenere massimo 1000 caratteri")
        String body
) {
}
