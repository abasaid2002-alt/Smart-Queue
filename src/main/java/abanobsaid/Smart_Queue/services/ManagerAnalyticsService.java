package abanobsaid.Smart_Queue.services;

import abanobsaid.Smart_Queue.entities.ServiceQueue;
import abanobsaid.Smart_Queue.entities.Ticket;
import abanobsaid.Smart_Queue.entities.TicketStatus;
import abanobsaid.Smart_Queue.entities.User;
import abanobsaid.Smart_Queue.payloads.ManagerAnalyticsResponseDTO;
import abanobsaid.Smart_Queue.repositories.TicketRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class ManagerAnalyticsService {

    @Autowired
    private ServiceQueueService serviceQueueService;

    @Autowired
    private TicketRepository ticketRepository;

    public ManagerAnalyticsResponseDTO getQueueAnalytics(long queueId, User currentUser) {
        ServiceQueue queue = serviceQueueService.getQueueById(queueId, currentUser);

        List<Ticket> tickets = ticketRepository.findByQueue(queue);

        LocalDate today = LocalDate.now();

        long waitingTickets = tickets.stream()
                .filter(ticket -> ticket.getStatus() == TicketStatus.WAITING)
                .count();

        long servingTickets = tickets.stream()
                .filter(ticket -> ticket.getStatus() == TicketStatus.SERVING)
                .count();

        long completedToday = tickets.stream()
                .filter(ticket -> ticket.getStatus() == TicketStatus.SERVED)
                .filter(ticket -> isToday(ticket.getCompletedAt(), today))
                .count();

        long cancelledToday = tickets.stream()
                .filter(ticket -> ticket.getStatus() == TicketStatus.CANCELLED)
                .filter(ticket -> isToday(ticket.getCreatedAt(), today))
                .count();

        long noShowToday = tickets.stream()
                .filter(ticket -> ticket.getStatus() == TicketStatus.NO_SHOW)
                .filter(ticket -> isToday(ticket.getCompletedAt(), today))
                .count();

        long smartDelayUsedToday = tickets.stream()
                .filter(Ticket::isSmartDelayUsed)
                .filter(ticket -> isToday(ticket.getSmartDelayAt(), today))
                .count();

        int averageWaitingMinutes = calculateAverageWaitingMinutes(tickets);
        int averageServiceMinutes = calculateAverageServiceMinutes(tickets);

        return new ManagerAnalyticsResponseDTO(
                queue.getId(),
                queue.getBusiness().getName(),
                queue.getCurrentNumber(),
                queue.getLastNumber(),
                waitingTickets,
                servingTickets,
                completedToday,
                cancelledToday,
                noShowToday,
                averageWaitingMinutes,
                averageServiceMinutes,
                smartDelayUsedToday
        );
    }

    private boolean isToday(LocalDateTime dateTime, LocalDate today) {
        return dateTime != null && dateTime.toLocalDate().equals(today);
    }

    private int calculateAverageWaitingMinutes(List<Ticket> tickets) {
        double average = tickets.stream()
                .filter(ticket -> ticket.getCalledAt() != null)
                .filter(ticket -> ticket.getCreatedAt() != null)
                .mapToLong(ticket -> Duration.between(ticket.getCreatedAt(), ticket.getCalledAt()).toMinutes())
                .filter(minutes -> minutes >= 0)
                .average()
                .orElse(0);

        return (int) Math.ceil(average);
    }

    private int calculateAverageServiceMinutes(List<Ticket> tickets) {
        double average = tickets.stream()
                .filter(ticket -> ticket.getCalledAt() != null)
                .filter(ticket -> ticket.getCompletedAt() != null)
                .mapToLong(ticket -> Duration.between(ticket.getCalledAt(), ticket.getCompletedAt()).toMinutes())
                .filter(minutes -> minutes >= 0)
                .average()
                .orElse(0);

        return (int) Math.ceil(average);
    }
}