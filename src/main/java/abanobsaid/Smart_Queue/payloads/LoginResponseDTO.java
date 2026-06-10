package abanobsaid.Smart_Queue.payloads;

import abanobsaid.Smart_Queue.entities.Role;

public record LoginResponseDTO(
        String token,
        long userId,
        String name,
        String surname,
        String email,
        Role role
) {
}