package abanobsaid.Smart_Queue.services;

import abanobsaid.Smart_Queue.entities.*;
import abanobsaid.Smart_Queue.repositories.ServiceQueueRepository;
import abanobsaid.Smart_Queue.repositories.TicketRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class TicketService {

    @Autowired
    private TicketRepository ticketRepository;

    @Autowired
    private ServiceQueueService serviceQueueService;

    @Autowired
    private ServiceQueueRepository serviceQueueRepository;

    public Ticket createTicket(long queueId, User currentUser) {
        if (currentUser.getRole() != Role.CLIENT) {
            throw new RuntimeException("Solo un cliente può prendere un numero");
        }

        ServiceQueue queue = serviceQueueService.findById(queueId);

        if (queue.getStatus() == QueueStatus.CLOSED) {
            throw new RuntimeException("Questa coda è chiusa");
        }

        int newNumber = queue.getLastNumber() + 1;

        queue.setLastNumber(newNumber);
        serviceQueueRepository.save(queue);

        Ticket newTicket = new Ticket(newNumber, queue, currentUser);

        return ticketRepository.save(newTicket);
    }

    public List<Ticket> getMyTickets(User currentUser) {
        return ticketRepository.findByUser(currentUser);
    }

    public List<Ticket> getTicketsByQueue(long queueId, User currentUser) {
        ServiceQueue queue = serviceQueueService.findById(queueId);

        checkQueueOwner(queue, currentUser);

        return ticketRepository.findByQueue(queue);
    }

    public Ticket cancelTicket(long ticketId, User currentUser) {
        Ticket ticket = findById(ticketId);

        if (ticket.getUser().getId() != currentUser.getId()) {
            throw new RuntimeException("Non puoi cancellare questo ticket");
        }

        if (ticket.getStatus() != TicketStatus.WAITING) {
            throw new RuntimeException("Puoi cancellare solo ticket in attesa");
        }

        ticket.setStatus(TicketStatus.CANCELLED);

        return ticketRepository.save(ticket);
    }

    public Ticket nextTicket(long queueId, User currentUser) {
        ServiceQueue queue = serviceQueueService.findById(queueId);

        checkQueueOwner(queue, currentUser);

        Ticket nextTicket = ticketRepository
                .findFirstByQueueAndStatusOrderByTicketNumberAsc(queue, TicketStatus.WAITING)
                .orElseThrow(() -> new RuntimeException("Non ci sono ticket in attesa"));

        nextTicket.setStatus(TicketStatus.SERVING);
        nextTicket.setServedAt(LocalDateTime.now());

        queue.setCurrentNumber(nextTicket.getTicketNumber());

        serviceQueueRepository.save(queue);

        return ticketRepository.save(nextTicket);
    }

    public Ticket findById(long ticketId) {
        return ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket non trovato"));
    }

    public int calculatePeopleBefore(Ticket ticket) {
        if (ticket.getStatus() != TicketStatus.WAITING) {
            return 0;
        }

        return ticketRepository.countByQueueAndStatusAndTicketNumberLessThan(
                ticket.getQueue(),
                TicketStatus.WAITING,
                ticket.getTicketNumber()
        );
    }

    private void checkQueueOwner(ServiceQueue queue, User currentUser) {
        if (currentUser.getRole() != Role.MANAGER) {
            throw new RuntimeException("Solo un manager può gestire i ticket");
        }

        if (queue.getBusiness().getOwner().getId() != currentUser.getId()) {
            throw new RuntimeException("Non puoi gestire questa coda");
        }
    }
}