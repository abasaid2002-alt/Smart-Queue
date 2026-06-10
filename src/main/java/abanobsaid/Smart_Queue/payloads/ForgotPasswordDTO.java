package abanobsaid.Smart_Queue.payloads;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record ForgotPasswordDTO(
        @Email(message = "Email non valida")
        @NotBlank(message = "L'email è obbligatoria")
        String email
) {
}