package abanobsaid.Smart_Queue.payloads;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record BusinessDTO(
        @NotEmpty(message = "Il nome dell'attività è obbligatorio")
        String name,

        @NotEmpty(message = "La descrizione è obbligatoria")
        String description,

        @NotEmpty(message = "L'indirizzo è obbligatorio")
        String address,

        @NotEmpty(message = "La città è obbligatoria")
        String city,

        @NotEmpty(message = "La categoria è obbligatoria")
        String category,

        @NotBlank(message = "L'orario di apertura è obbligatorio")
        @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = "L'orario di apertura deve essere nel formato HH:mm")
        String openingTime,

        @NotBlank(message = "L'orario di chiusura è obbligatorio")
        @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = "L'orario di chiusura deve essere nel formato HH:mm")
        String closingTime
) {
}
