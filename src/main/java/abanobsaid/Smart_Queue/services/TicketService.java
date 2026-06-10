package abanobsaid.Smart_Queue.services;

import abanobsaid.Smart_Queue.entities.*;
import abanobsaid.Smart_Queue.payloads.WaitingInfoResponseDTO;
import abanobsaid.Smart_Queue.repositories.ServiceQueueRepository;
import abanobsaid.Smart_Queue.repositories.DailyTicketReservationRepository;
import abanobsaid.Smart_Queue.repositories.TicketRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
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

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private DailyTicketReservationRepository dailyTicketReservationRepository;

    @Value("${app.ticket.cancel-min-people-before:2}")
    private int cancelMinPeopleBefore;

    @Transactional
    public Ticket createTicket(long queueId, User currentUser) {
        if (currentUser.getRole() != Role.CLIENT && currentUser.getRole() != Role.MANAGER) {
            throw new RuntimeException("Non puoi prendere un numero con questo account");
        }

        ServiceQueue queue = serviceQueueService.findById(queueId);

        if (currentUser.getRole() == Role.MANAGER && queue.getBusiness().getOwner().getId() == currentUser.getId()) {
            throw new RuntimeException("Non puoi prenotare ticket nelle tue attività");
        }

        if (!serviceQueueService.isQueueAvailableForTickets(queue)) {
            throw new RuntimeException(serviceQueueService.buildAvailabilityMessage(queue));
        }

        queue = serviceQueueService.findById(queueId);

        Business business = queue.getBusiness();
        LocalDate today = LocalDate.now();

        if (dailyTicketReservationRepository.existsByUserAndBusinessAndReservationDate(currentUser, business, today)) {
            throw new RuntimeException("Hai già preso un ticket oggi per questa attività");
        }

        int newNumber = queue.getLastNumber() + 1;

        queue.setLastNumber(newNumber);
        serviceQueueRepository.save(queue);

        dailyTicketReservationRepository.save(new DailyTicketReservation(currentUser, business, today));

        Ticket newTicket = new Ticket(newNumber, queue, currentUser);
        newTicket.setSortOrder(nextSortOrder(queue));

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
                .filter(this::isTicketForQueueBusinessDay)
                .filter(ticket -> ticket.getStatus() == TicketStatus.WAITING || ticket.getStatus() == TicketStatus.SERVING)
                .sorted(Comparator.comparingInt(Ticket::getSortOrder).thenComparing(Ticket::getTicketNumber))
                .toList();
    }

    @Transactional
    public Ticket cancelTicket(long ticketId, User currentUser) {
        Ticket ticket = findById(ticketId);

        if ((currentUser.getRole() != Role.CLIENT && currentUser.getRole() != Role.MANAGER) || ticket.getUser().getId() != currentUser.getId()) {
            throw new RuntimeException("Non puoi cancellare questo ticket");
        }

        if (ticket.getStatus() != TicketStatus.WAITING) {
            throw new RuntimeException("Puoi cancellare solo ticket in attesa");
        }

        if (!canCancel(ticket)) {
            throw new RuntimeException("Non puoi cancellare il ticket quando il turno è troppo vicino");
        }

        ticket.setStatus(TicketStatus.CANCELLED);

        Ticket savedTicket = ticketRepository.save(ticket);
        compactWaitingSortOrder(savedTicket.getQueue());

        createNotificationSafely(
                savedTicket.getUser(),
                savedTicket,
                NotificationType.TICKET_CANCELLED,
                "Il tuo ticket numero " + savedTicket.getTicketNumber() + " è stato cancellato"
        );

        createNotificationSafely(
                savedTicket.getQueue().getBusiness().getOwner(),
                savedTicket,
                NotificationType.TICKET_CANCELLED,
                savedTicket.getUser().getName() + " ha cancellato il ticket #" + savedTicket.getTicketNumber() + " per " + savedTicket.getQueue().getBusiness().getName()
        );

        return savedTicket;
    }

    @Transactional
    public Ticket nextTicket(long queueId, User currentUser) {
        ServiceQueue queue = serviceQueueService.findById(queueId);

        checkQueueOwner(queue, currentUser);

        boolean servingAlreadyExists = ticketRepository.findByQueue(queue)
                .stream()
                .filter(this::isTicketForQueueBusinessDay)
                .anyMatch(ticket -> ticket.getStatus() == TicketStatus.SERVING);

        if (servingAlreadyExists) {
            throw new RuntimeException("Completa, ripristina o segna no-show il ticket in servizio prima di chiamare il prossimo");
        }

        Ticket nextTicket = getWaitingTickets(queue)
                .stream()
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Non ci sono ticket in attesa"));

        nextTicket.setStatus(TicketStatus.SERVING);
        nextTicket.setCalledAt(LocalDateTime.now());

        queue.setCurrentNumber(nextTicket.getTicketNumber());

        serviceQueueRepository.save(queue);

        Ticket savedTicket = ticketRepository.save(nextTicket);

        createNotificationSafely(
                savedTicket.getUser(),
                savedTicket,
                NotificationType.TURN_CALLED,
                "Il tuo turno è stato chiamato. Ticket numero " + savedTicket.getTicketNumber()
        );

        createNearTurnNotifications(queue);

        return savedTicket;
    }

    @Transactional
    public Ticket undoLastNext(long queueId, User currentUser) {
        ServiceQueue queue = serviceQueueService.findById(queueId);

        checkQueueOwner(queue, currentUser);

        Ticket lastServingTicket = ticketRepository.findByQueue(queue)
                .stream()
                .filter(this::isTicketForQueueBusinessDay)
                .filter(ticket -> ticket.getStatus() == TicketStatus.SERVING)
                .filter(ticket -> ticket.getCalledAt() != null)
                .max(Comparator.comparing(Ticket::getCalledAt))
                .orElse(null);

        if (lastServingTicket != null) {
            lastServingTicket.setStatus(TicketStatus.WAITING);
            lastServingTicket.setCalledAt(null);
            lastServingTicket.setCompletedAt(null);
            lastServingTicket.setSortOrder(1);

            Ticket savedTicket = ticketRepository.save(lastServingTicket);
            compactWaitingSortOrder(queue);
            refreshCurrentNumber(queue);

            return savedTicket;
        }

        Ticket lastFinalizedTicket = findLastFinalizedTicket(queue);

        if (lastFinalizedTicket == null) {
            throw new RuntimeException("Non ci sono ticket chiamati o completati da annullare");
        }

        return undoCompletedTicket(lastFinalizedTicket.getId(), currentUser);
    }

    @Transactional
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

    @Transactional
    public Ticket undoCompletedTicket(long ticketId, User currentUser) {
        Ticket ticket = findById(ticketId);

        checkQueueOwner(ticket.getQueue(), currentUser);

        if (!canUndoFinalization(ticket)) {
            throw new RuntimeException("Puoi ripristinare solo un ticket completato o no-show");
        }

        boolean otherServingTicketExists = ticketRepository.findByQueue(ticket.getQueue())
                .stream()
                .filter(this::isTicketForQueueBusinessDay)
                .anyMatch(otherTicket -> otherTicket.getStatus() == TicketStatus.SERVING && otherTicket.getId() != ticket.getId());

        if (otherServingTicketExists) {
            throw new RuntimeException("C'è già un altro ticket in servizio. Chiudilo prima di ripristinare questo ticket");
        }

        ticket.setStatus(TicketStatus.SERVING);
        ticket.setCompletedAt(null);

        if (ticket.getCalledAt() == null) {
            ticket.setCalledAt(LocalDateTime.now());
        }

        ServiceQueue queue = ticket.getQueue();
        queue.setCurrentNumber(ticket.getTicketNumber());
        serviceQueueRepository.save(queue);

        return ticketRepository.save(ticket);
    }

    @Transactional
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

    @Transactional
    public Ticket smartDelay(long ticketId, int positions, User currentUser) {
        Ticket ticket = findById(ticketId);

        if (currentUser.getRole() != Role.CLIENT && currentUser.getRole() != Role.MANAGER) {
            throw new RuntimeException("Non puoi usare Smart Delay con questo account");
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

        List<Ticket> waitingTickets = getWaitingTickets(ticket.getQueue());

        int currentIndex = indexOfTicket(waitingTickets, ticket);

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

        saveWaitingTicketsWithCompactOrder(waitingTickets);

        Ticket savedTicket = findById(ticketId);

        createNotificationSafely(
                savedTicket.getQueue().getBusiness().getOwner(),
                savedTicket,
                NotificationType.TICKET_POSTPONED,
                savedTicket.getUser().getName() + " ha posticipato il ticket #" + savedTicket.getTicketNumber() + " per " + savedTicket.getQueue().getBusiness().getName()
        );

        return savedTicket;
    }

    public WaitingInfoResponseDTO getWaitingInfo(long ticketId, User currentUser) {
        Ticket ticket = findById(ticketId);

        if (ticket.getUser().getId() != currentUser.getId() && currentUser.getRole() != Role.MANAGER) {
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
                .filter(this::isTicketForQueueBusinessDay)
                .filter(t -> t.getStatus() == TicketStatus.WAITING)
                .filter(t -> t.getSortOrder() < ticket.getSortOrder())
                .count();
    }

    public boolean canCancel(Ticket ticket) {
        if (ticket.getStatus() != TicketStatus.WAITING) {
            return false;
        }

        return calculatePeopleBefore(ticket) >= cancelMinPeopleBefore;
    }

    public boolean canSmartDelay(Ticket ticket) {
        if (ticket.getStatus() != TicketStatus.WAITING || ticket.isSmartDelayUsed()) {
            return false;
        }

        List<Ticket> waitingTickets = getWaitingTickets(ticket.getQueue());
        int currentIndex = indexOfTicket(waitingTickets, ticket);

        return currentIndex >= 0 && currentIndex < waitingTickets.size() - 1;
    }

    public boolean canUndoFinalization(Ticket ticket) {
        return ticket.getStatus() == TicketStatus.SERVED || ticket.getStatus() == TicketStatus.NO_SHOW;
    }

    private Ticket findLastFinalizedTicket(ServiceQueue queue) {
        return ticketRepository.findByQueue(queue)
                .stream()
                .filter(this::isTicketForQueueBusinessDay)
                .filter(ticket -> ticket.getStatus() == TicketStatus.SERVED || ticket.getStatus() == TicketStatus.NO_SHOW)
                .filter(ticket -> ticket.getCompletedAt() != null)
                .max(Comparator.comparing(Ticket::getCompletedAt))
                .orElse(null);
    }

    private int nextSortOrder(ServiceQueue queue) {
        return ticketRepository.findByQueue(queue)
                .stream()
                .filter(this::isTicketForQueueBusinessDay)
                .filter(ticket -> ticket.getStatus() == TicketStatus.WAITING)
                .mapToInt(Ticket::getSortOrder)
                .max()
                .orElse(0) + 1;
    }

    private void compactWaitingSortOrder(ServiceQueue queue) {
        saveWaitingTicketsWithCompactOrder(getWaitingTickets(queue));
    }

    private void saveWaitingTicketsWithCompactOrder(List<Ticket> waitingTickets) {
        for (int i = 0; i < waitingTickets.size(); i++) {
            waitingTickets.get(i).setSortOrder(i + 1);
        }

        ticketRepository.saveAll(waitingTickets);
    }

    private List<Ticket> getWaitingTickets(ServiceQueue queue) {
        return new ArrayList<>(
                ticketRepository.findByQueue(queue)
                        .stream()
                        .filter(this::isTicketForQueueBusinessDay)
                        .filter(t -> t.getStatus() == TicketStatus.WAITING)
                        .sorted(Comparator.comparingInt(Ticket::getSortOrder).thenComparing(Ticket::getTicketNumber))
                        .toList()
        );
    }

    private int indexOfTicket(List<Ticket> tickets, Ticket ticket) {
        for (int i = 0; i < tickets.size(); i++) {
            if (tickets.get(i).getId() == ticket.getId()) {
                return i;
            }
        }

        return -1;
    }

    private void refreshCurrentNumber(ServiceQueue queue) {
        Ticket currentServingTicket = ticketRepository.findByQueue(queue)
                .stream()
                .filter(this::isTicketForQueueBusinessDay)
                .filter(ticket -> ticket.getStatus() == TicketStatus.SERVING)
                .filter(ticket -> ticket.getCalledAt() != null)
                .max(Comparator.comparing(Ticket::getCalledAt))
                .orElse(null);

        queue.setCurrentNumber(currentServingTicket != null ? currentServingTicket.getTicketNumber() : 0);
        serviceQueueRepository.save(queue);
    }

    private void createNearTurnNotifications(ServiceQueue queue) {
        List<Ticket> waitingTickets = ticketRepository.findByQueue(queue)
                .stream()
                .filter(this::isTicketForQueueBusinessDay)
                .filter(ticket -> ticket.getStatus() == TicketStatus.WAITING)
                .sorted(Comparator.comparingInt(Ticket::getSortOrder))
                .toList();

        for (int i = 0; i < waitingTickets.size(); i++) {
            Ticket ticket = waitingTickets.get(i);

            if (i <= 1) {
                createNotificationIfMissingSafely(
                        ticket.getUser(),
                        ticket,
                        NotificationType.TURN_NEAR,
                        "Manca poco al tuo turno presso " + queue.getBusiness().getName() + ". Persone davanti: " + i
                );
            }
        }
    }

    private void createNotificationSafely(User user, Ticket ticket, NotificationType type, String message) {
        try {
            notificationService.createNotification(user, ticket, type, message);
        } catch (Exception ignored) {
            // Le notifiche non devono annullare l'azione principale sul ticket.
        }
    }

    private void createNotificationIfMissingSafely(User user, Ticket ticket, NotificationType type, String message) {
        try {
            notificationService.createNotificationIfMissing(user, ticket, type, message);
        } catch (Exception ignored) {
            // Le notifiche non devono annullare l'azione principale sul ticket.
        }
    }


    private boolean isTicketForQueueBusinessDay(Ticket ticket) {
        if (ticket.getCreatedAt() == null) {
            return true;
        }

        LocalDate businessDay = ticket.getQueue().getBusinessDay();

        if (businessDay == null) {
            businessDay = LocalDate.now();
        }

        return ticket.getCreatedAt().toLocalDate().equals(businessDay);
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