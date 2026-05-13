package abanobsaid.Smart_Queue.payloads;

import jakarta.validation.constraints.NotEmpty;

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
        String category
) {
}