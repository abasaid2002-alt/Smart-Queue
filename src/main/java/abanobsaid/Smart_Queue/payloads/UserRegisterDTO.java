package abanobsaid.Smart_Queue.payloads;

import abanobsaid.Smart_Queue.entities.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

public record UserRegisterDTO(
        @NotEmpty(message = "Il nome è obbligatorio")
        String name,

        @NotEmpty(message = "Il cognome è obbligatorio")
        String surname,

        @Email(message = "Email non valida")
        @NotEmpty(message = "L'email è obbligatoria")
        String email,

        @NotEmpty(message = "La password è obbligatoria")
        String password,

        @NotNull(message = "Il ruolo è obbligatorio")
        Role role
) {
}