package abanobsaid.Smart_Queue.payloads;

import abanobsaid.Smart_Queue.entities.Role;

public record UserResponseDTO(
        long id,
        String name,
        String surname,
        String email,
        Role role
) {
}