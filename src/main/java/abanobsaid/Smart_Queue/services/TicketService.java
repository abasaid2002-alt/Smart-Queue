package abanobsaid.Smart_Queue.services;

import abanobsaid.Smart_Queue.entities.*;
import abanobsaid.Smart_Queue.payloads.WaitingInfoResponseDTO;
import abanobsaid.Smart_Queue.repositories.ServiceQueueRepository;
import abanobsaid.Smart_Queue.repositories.TicketRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
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
        return ticketRepository.findByUser(currentUser)
                .stream()
                .sorted(Comparator.comparing(Ticket::getCreatedAt).reversed())
                .toList();
    }

    public List<Ticket> getTicketsByQueue(long queueId, User currentUser) {
        ServiceQueue queue = serviceQueueService.findById(queueId);

        checkQueueOwner(queue, currentUser);

        return ticketRepository.findByQueue(queue)
                .stream()
                .sorted(Comparator.comparingInt(Ticket::getSortOrder))
                .toList();
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
                .findFirstByQueueAndStatusOrderBySortOrderAsc(queue, TicketStatus.WAITING)
                .orElseThrow(() -> new RuntimeException("Non ci sono ticket in attesa"));

        nextTicket.setStatus(TicketStatus.SERVING);
        nextTicket.setCalledAt(LocalDateTime.now());

        queue.setCurrentNumber(nextTicket.getTicketNumber());

        serviceQueueRepository.save(queue);

        return ticketRepository.save(nextTicket);
    }

    public Ticket undoLastNext(long queueId, User currentUser) {
        ServiceQueue queue = serviceQueueService.findById(queueId);

        checkQueueOwner(queue, currentUser);

        Ticket lastCalledTicket = ticketRepository.findByQueue(queue)
                .stream()
                .filter(ticket -> ticket.getStatus() == TicketStatus.SERVING)
                .filter(ticket -> ticket.getCalledAt() != null)
                .max(Comparator.comparing(Ticket::getCalledAt))
                .orElseThrow(() -> new RuntimeException("Non ci sono ticket chiamati da annullare"));

        lastCalledTicket.setStatus(TicketStatus.WAITING);
        lastCalledTicket.setCalledAt(null);

        Ticket previousServingTicket = ticketRepository.findByQueue(queue)
                .stream()
                .filter(ticket -> ticket.getStatus() == TicketStatus.SERVING)
                .filter(ticket -> ticket.getId() != lastCalledTicket.getId())
                .filter(ticket -> ticket.getCalledAt() != null)
                .max(Comparator.comparing(Ticket::getCalledAt))
                .orElse(null);

        if (previousServingTicket != null) {
            queue.setCurrentNumber(previousServingTicket.getTicketNumber());
        } else {
            queue.setCurrentNumber(0);
        }

        serviceQueueRepository.save(queue);

        return ticketRepository.save(lastCalledTicket);
    }

    public Ticket completeTicket(long ticketId, User currentUser) {
        Ticket ticket = findById(ticketId);

        checkQueueOwner(ticket.getQueue(), currentUser);

        if (ticket.getStatus() != TicketStatus.SERVING) {
            throw new RuntimeException("Puoi completare solo un ticket in servizio");
        }

        ticket.setStatus(TicketStatus.SERVED);
        ticket.setCompletedAt(LocalDateTime.now());

        return ticketRepository.save(ticket);
    }

    public Ticket markNoShow(long ticketId, User currentUser) {
        Ticket ticket = findById(ticketId);

        checkQueueOwner(ticket.getQueue(), currentUser);

        if (ticket.getStatus() != TicketStatus.SERVING) {
            throw new RuntimeException("Puoi segnare no-show solo un ticket in servizio");
        }

        ticket.setStatus(TicketStatus.NO_SHOW);
        ticket.setCompletedAt(LocalDateTime.now());

        return ticketRepository.save(ticket);
    }

    public Ticket smartDelay(long ticketId, int positions, User currentUser) {
        Ticket ticket = findById(ticketId);

        if (currentUser.getRole() != Role.CLIENT) {
            throw new RuntimeException("Solo un cliente può usare Smart Delay");
        }

        if (ticket.getUser().getId() != currentUser.getId()) {
            throw new RuntimeException("Non puoi usare Smart Delay su questo ticket");
        }

        if (ticket.getStatus() != TicketStatus.WAITING) {
            throw new RuntimeException("Smart Delay può essere usato solo su ticket in attesa");
        }

        if (ticket.isSmartDelayUsed()) {
            throw new RuntimeException("Smart Delay è già stato usato per questo ticket");
        }

        if (positions < 1 || positions > 3) {
            throw new RuntimeException("Puoi rimandare il turno da 1 a massimo 3 posizioni");
        }

        List<Ticket> waitingTickets = new ArrayList<>(
                ticketRepository.findByQueue(ticket.getQueue())
                        .stream()
                        .filter(t -> t.getStatus() == TicketStatus.WAITING)
                        .sorted(Comparator.comparingInt(Ticket::getSortOrder))
                        .toList()
        );

        int currentIndex = -1;

        for (int i = 0; i < waitingTickets.size(); i++) {
            if (waitingTickets.get(i).getId() == ticket.getId()) {
                currentIndex = i;
                break;
            }
        }

        if (currentIndex == -1) {
            throw new RuntimeException("Ticket non trovato nella coda di attesa");
        }

        if (currentIndex == waitingTickets.size() - 1) {
            throw new RuntimeException("Non puoi usare Smart Delay perché sei già l'ultimo in coda");
        }

        Ticket ticketToMove = waitingTickets.remove(currentIndex);

        int newIndex = Math.min(currentIndex + positions, waitingTickets.size());

        waitingTickets.add(newIndex, ticketToMove);

        ticketToMove.setSmartDelayUsed(true);
        ticketToMove.setSmartDelayAt(LocalDateTime.now());

        for (int i = 0; i < waitingTickets.size(); i++) {
            waitingTickets.get(i).setSortOrder(i + 1);
        }

        ticketRepository.saveAll(waitingTickets);

        return findById(ticketId);
    }

    public WaitingInfoResponseDTO getWaitingInfo(long ticketId, User currentUser) {
        Ticket ticket = findById(ticketId);

        if (currentUser.getRole() == Role.CLIENT && ticket.getUser().getId() != currentUser.getId()) {
            throw new RuntimeException("Non puoi vedere le informazioni di questo ticket");
        }

        if (currentUser.getRole() == Role.MANAGER) {
            checkQueueOwner(ticket.getQueue(), currentUser);
        }

        int peopleBefore = calculatePeopleBefore(ticket);

        int position = 0;
        int estimatedWaitingMinutes = 0;

        if (ticket.getStatus() == TicketStatus.WAITING) {
            position = peopleBefore + 1;
        }

        int averageServiceMinutes = calculateAverageServiceMinutes(ticket.getQueue());

        if (ticket.getStatus() == TicketStatus.WAITING) {
            estimatedWaitingMinutes = peopleBefore * averageServiceMinutes;
        }

        return new WaitingInfoResponseDTO(
                ticket.getId(),
                ticket.getTicketNumber(),
                ticket.getStatus(),
                position,
                peopleBefore,
                averageServiceMinutes,
                estimatedWaitingMinutes
        );
    }

    public int calculateAverageServiceMinutes(ServiceQueue queue) {
        List<Ticket> servedTickets = ticketRepository.findByQueue(queue)
                .stream()
                .filter(ticket -> ticket.getStatus() == TicketStatus.SERVED)
                .filter(ticket -> ticket.getCalledAt() != null)
                .filter(ticket -> ticket.getCompletedAt() != null)
                .sorted(Comparator.comparing(Ticket::getCompletedAt).reversed())
                .limit(5)
                .toList();

        if (servedTickets.isEmpty()) {
            return 5;
        }

        double average = servedTickets.stream()
                .mapToLong(ticket -> Duration.between(ticket.getCalledAt(), ticket.getCompletedAt()).toMinutes())
                .filter(minutes -> minutes > 0)
                .average()
                .orElse(5);

        return (int) Math.ceil(average);
    }

    public Ticket findById(long ticketId) {
        return ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket non trovato"));
    }

    public int calculatePeopleBefore(Ticket ticket) {
        if (ticket.getStatus() != TicketStatus.WAITING) {
            return 0;
        }

        return (int) ticketRepository.findByQueue(ticket.getQueue())
                .stream()
                .filter(t -> t.getStatus() == TicketStatus.WAITING)
                .filter(t -> t.getSortOrder() < ticket.getSortOrder())
                .count();
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