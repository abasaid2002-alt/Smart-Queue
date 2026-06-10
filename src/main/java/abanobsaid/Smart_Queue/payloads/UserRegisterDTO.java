package abanobsaid.Smart_Queue.payloads;

import abanobsaid.Smart_Queue.entities.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UserRegisterDTO(
        @NotBlank(message = "Il nome è obbligatorio")
        @Size(min = 2, max = 50, message = "Il nome deve avere tra 2 e 50 caratteri")
        String name,

        @NotBlank(message = "Il cognome è obbligatorio")
        @Size(min = 2, max = 50, message = "Il cognome deve avere tra 2 e 50 caratteri")
        String surname,

        @Email(message = "Email non valida")
        @NotBlank(message = "L'email è obbligatoria")
        @Size(max = 120, message = "L'email non può superare 120 caratteri")
        String email,

        @NotBlank(message = "La password è obbligatoria")
        @Size(min = 8, max = 72, message = "La password deve avere tra 8 e 72 caratteri")
        @Pattern(
                regexp = "^(?=\\S+$)(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).+$",
                message = "La password deve contenere almeno una maiuscola, una minuscola, un numero, un carattere speciale e non deve contenere spazi"
        )
        String password,

        @NotNull(message = "Il ruolo è obbligatorio")
        Role role,

        @Size(max = 120, message = "Il nome dell'attività non può superare 120 caratteri")
        String businessName,

        @Size(max = 500, message = "La descrizione non può superare 500 caratteri")
        String businessDescription,

        @Size(max = 180, message = "L'indirizzo non può superare 180 caratteri")
        String businessAddress,

        @Size(max = 80, message = "La città non può superare 80 caratteri")
        String businessCity,

        @Size(max = 80, message = "La categoria non può superare 80 caratteri")
        String businessCategory
) {
}
