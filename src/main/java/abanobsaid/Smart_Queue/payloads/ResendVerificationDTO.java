package abanobsaid.Smart_Queue.payloads;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResendVerificationDTO(
        @Email(message = "Email non valida")
        @NotBlank(message = "L'email è obbligatoria")
        @Size(max = 120, message = "L'email non può superare 120 caratteri")
        String email
) {
}