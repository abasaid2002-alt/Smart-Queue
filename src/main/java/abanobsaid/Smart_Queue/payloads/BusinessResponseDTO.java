package abanobsaid.Smart_Queue.payloads;

public record BusinessResponseDTO(
        long id,
        String name,
        String description,
        String address,
        String city,
        String category,
        long ownerId,
        String ownerName
) {
}