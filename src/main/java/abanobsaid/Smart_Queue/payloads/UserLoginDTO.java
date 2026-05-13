package abanobsaid.Smart_Queue.payloads;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;

public record UserLoginDTO(
        @Email(message = "Email non valida")
        @NotEmpty(message = "L'email è obbligatoria")
        String email,

        @NotEmpty(message = "La password è obbligatoria")
        String password
) {
}