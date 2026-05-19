package abanobsaid.Smart_Queue.payloads;

public record ManagerAnalyticsResponseDTO(
        long queueId,
        String businessName,
        int currentNumber,
        int lastNumber,
        long waitingTickets,
        long servingTickets,
        long completedToday,
        long cancelledToday,
        long noShowToday,
        int averageWaitingMinutes,
        int averageServiceMinutes,
        long smartDelayUsedToday
) {
}