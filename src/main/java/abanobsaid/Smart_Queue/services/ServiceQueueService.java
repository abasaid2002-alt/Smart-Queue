package abanobsaid.Smart_Queue.services;

import abanobsaid.Smart_Queue.entities.*;
import abanobsaid.Smart_Queue.repositories.DailyTicketReservationRepository;
import abanobsaid.Smart_Queue.repositories.ServiceQueueRepository;
import abanobsaid.Smart_Queue.repositories.TicketRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;

@Service
public class ServiceQueueService {

    @Autowired
    private ServiceQueueRepository serviceQueueRepository;

    @Autowired
    private BusinessService businessService;

    @Autowired
    private TicketRepository ticketRepository;

    @Autowired
    private DailyTicketReservationRepository dailyTicketReservationRepository;

    @Autowired
    private NotificationService notificationService;

    @Transactional
    public ServiceQueue createQueue(long businessId, User currentUser) {
        Business business = businessService.findById(businessId);

        checkBusinessOwner(business, currentUser);

        return synchronizeQueueState(businessService.createQueueIfMissing(business));
    }

    @Transactional
    public ServiceQueue findById(long queueId) {
        ServiceQueue queue = serviceQueueRepository.findById(queueId)
                .orElseThrow(() -> new RuntimeException("Coda non trovata"));

        return synchronizeQueueState(queue);
    }

    @Transactional
    public ServiceQueue getQueueById(long queueId, User currentUser) {
        ServiceQueue queue = findById(queueId);

        checkBusinessOwner(queue.getBusiness(), currentUser);

        return queue;
    }

    @Transactional
    public ServiceQueue getQueueByBusiness(long businessId, User currentUser) {
        Business business = businessService.findById(businessId);

        checkBusinessOwner(business, currentUser);

        ServiceQueue queue = serviceQueueRepository.findByBusiness(business)
                .orElseGet(() -> businessService.createQueueIfMissing(business));

        return synchronizeQueueState(queue);
    }

    @Transactional
    public ServiceQueue findByBusinessId(long businessId, User currentUser) {
        Business business = businessService.findById(businessId);

        if (!business.isActive() && (currentUser.getRole() != Role.MANAGER || business.getOwner().getId() != currentUser.getId())) {
            throw new RuntimeException("Attività non disponibile");
        }

        ServiceQueue queue = serviceQueueRepository.findByBusiness(business)
                .orElseGet(() -> {
                    if (currentUser.getRole() == Role.MANAGER && business.getOwner().getId() == currentUser.getId()) {
                        return businessService.createQueueIfMissing(business);
                    }

                    throw new RuntimeException("Coda non trovata");
                });

        return synchronizeQueueState(queue);
    }

    @Transactional
    public ServiceQueue openQueue(long queueId, User currentUser) {
        ServiceQueue queue = serviceQueueRepository.findById(queueId)
                .orElseThrow(() -> new RuntimeException("Coda non trovata"));

        checkBusinessOwner(queue.getBusiness(), currentUser);

        queue.setManuallyPaused(false);
        ServiceQueue synchronizedQueue = synchronizeQueueState(queue);

        if (hasBusinessHours(synchronizedQueue.getBusiness()) && !isInsideBusinessHours(synchronizedQueue.getBusiness())) {
            throw new RuntimeException("La coda si aprirà automaticamente durante l'orario di apertura dell'attività");
        }

        return synchronizedQueue;
    }

    @Transactional
    public ServiceQueue closeQueue(long queueId, User currentUser) {
        ServiceQueue queue = serviceQueueRepository.findById(queueId)
                .orElseThrow(() -> new RuntimeException("Coda non trovata"));

        checkBusinessOwner(queue.getBusiness(), currentUser);

        queue.setManuallyPaused(true);
        queue.setStatus(QueueStatus.CLOSED);

        ServiceQueue savedQueue = serviceQueueRepository.save(queue);

        createQueueClosedNotifications(savedQueue);

        return savedQueue;
    }

    @Transactional
    public ServiceQueue resetQueue(long queueId, User currentUser) {
        ServiceQueue queue = serviceQueueRepository.findById(queueId)
                .orElseThrow(() -> new RuntimeException("Coda non trovata"));

        checkBusinessOwner(queue.getBusiness(), currentUser);

        LocalDate today = LocalDate.now();
        List<Ticket> activeTickets = ticketRepository.findByQueue(queue)
                .stream()
                .filter(ticket -> ticket.getCreatedAt() == null || ticket.getCreatedAt().toLocalDate().equals(today))
                .filter(ticket -> ticket.getStatus() == TicketStatus.WAITING || ticket.getStatus() == TicketStatus.SERVING)
                .toList();

        for (Ticket ticket : activeTickets) {
            if (ticket.getStatus() == TicketStatus.SERVING) {
                ticket.setStatus(TicketStatus.NO_SHOW);
            } else {
                ticket.setStatus(TicketStatus.CANCELLED);
            }
            ticket.setCompletedAt(LocalDateTime.now());
        }

        if (!activeTickets.isEmpty()) {
            ticketRepository.saveAll(activeTickets);
        }

        createQueueResetNotifications(queue, activeTickets, currentUser);

        dailyTicketReservationRepository.deleteByBusinessAndReservationDate(queue.getBusiness(), today);

        queue.setCurrentNumber(0);
        queue.setLastNumber(0);
        queue.setBusinessDay(today);
        queue.setManuallyPaused(false);

        if (hasBusinessHours(queue.getBusiness()) && !isInsideBusinessHours(queue.getBusiness())) {
            queue.setStatus(QueueStatus.CLOSED);
        } else {
            queue.setStatus(QueueStatus.OPEN);
        }

        return serviceQueueRepository.save(queue);
    }

    @Scheduled(fixedDelay = 60000)
    @Transactional
    public void synchronizeAllQueues() {
        for (ServiceQueue queue : serviceQueueRepository.findAll()) {
            synchronizeQueueState(queue);
        }
    }

    @Transactional
    public ServiceQueue synchronizeQueueState(ServiceQueue queue) {
        Business business = queue.getBusiness();

        if (!business.isActive()) {
            queue.setStatus(QueueStatus.CLOSED);
            queue.setLastAutomaticSyncAt(LocalDateTime.now());
            return serviceQueueRepository.save(queue);
        }

        if (!hasBusinessHours(business)) {
            boolean wasOpen = queue.getStatus() == QueueStatus.OPEN;

            if (queue.isManuallyPaused()) {
                queue.setStatus(QueueStatus.CLOSED);
            } else {
                queue.setStatus(QueueStatus.OPEN);
            }

            queue.setLastAutomaticSyncAt(LocalDateTime.now());
            ServiceQueue savedQueue = serviceQueueRepository.save(queue);

            if (wasOpen && savedQueue.getStatus() == QueueStatus.CLOSED) {
                createQueueClosedNotifications(savedQueue);
            }

            if (!wasOpen && savedQueue.getStatus() == QueueStatus.OPEN) {
                createQueueReopenedNotifications(savedQueue);
            }

            return savedQueue;
        }

        LocalDate today = LocalDate.now();
        boolean insideBusinessHours = isInsideBusinessHours(business);
        boolean wasOpen = queue.getStatus() == QueueStatus.OPEN;

        if (insideBusinessHours && (queue.getBusinessDay() == null || !queue.getBusinessDay().equals(today))) {
            closePreviousDayActiveTickets(queue, today);
            queue.setCurrentNumber(0);
            queue.setLastNumber(0);
            queue.setBusinessDay(today);
            queue.setManuallyPaused(false);
        }

        if (!insideBusinessHours) {
            queue.setStatus(QueueStatus.CLOSED);
        } else if (queue.isManuallyPaused()) {
            queue.setStatus(QueueStatus.CLOSED);
        } else {
            queue.setStatus(QueueStatus.OPEN);
        }

        queue.setLastAutomaticSyncAt(LocalDateTime.now());

        ServiceQueue savedQueue = serviceQueueRepository.save(queue);

        if (wasOpen && savedQueue.getStatus() == QueueStatus.CLOSED && !savedQueue.isManuallyPaused()) {
            createQueueClosedNotifications(savedQueue);
        }

        if (!wasOpen && savedQueue.getStatus() == QueueStatus.OPEN) {
            createQueueReopenedNotifications(savedQueue);
        }

        return savedQueue;
    }

    public boolean isQueueAvailableForTickets(ServiceQueue queue) {
        ServiceQueue synchronizedQueue = synchronizeQueueState(queue);

        return synchronizedQueue.getStatus() == QueueStatus.OPEN && !synchronizedQueue.isManuallyPaused();
    }

    public LocalDateTime calculateNextOpeningAt(ServiceQueue queue) {
        Business business = queue.getBusiness();

        if (!business.isActive()) {
            return null;
        }

        if (!hasBusinessHours(business)) {
            return null;
        }

        LocalDate today = LocalDate.now();
        LocalDateTime nextOpening = LocalDateTime.of(today, business.getOpeningTime());

        if (!LocalDateTime.now().isBefore(nextOpening)) {
            nextOpening = nextOpening.plusDays(1);
        }

        return nextOpening;
    }

    public String buildAvailabilityMessage(ServiceQueue queue) {
        Business business = queue.getBusiness();

        if (!business.isActive()) {
            return "Attività non disponibile";
        }

        if (!hasBusinessHours(business)) {
            return queue.getStatus() == QueueStatus.OPEN ? "Coda aperta" : "Coda chiusa";
        }

        if (!isInsideBusinessHours(business)) {
            return "Fuori orario. Prossima apertura alle " + business.getOpeningTime();
        }

        if (queue.isManuallyPaused()) {
            return "Coda sospesa dal manager";
        }

        return "Coda aperta fino alle " + business.getClosingTime();
    }

    private void closePreviousDayActiveTickets(ServiceQueue queue, LocalDate today) {
        List<Ticket> activeOldTickets = ticketRepository.findByQueue(queue)
                .stream()
                .filter(ticket -> ticket.getCreatedAt() != null)
                .filter(ticket -> ticket.getCreatedAt().toLocalDate().isBefore(today))
                .filter(ticket -> ticket.getStatus() == TicketStatus.WAITING || ticket.getStatus() == TicketStatus.SERVING)
                .toList();

        for (Ticket ticket : activeOldTickets) {
            if (ticket.getStatus() == TicketStatus.WAITING) {
                ticket.setStatus(TicketStatus.CANCELLED);
            } else {
                ticket.setStatus(TicketStatus.NO_SHOW);
            }

            ticket.setCompletedAt(LocalDateTime.now());
        }

        if (!activeOldTickets.isEmpty()) {
            ticketRepository.saveAll(activeOldTickets);
        }
    }

    private boolean hasBusinessHours(Business business) {
        return business.getOpeningTime() != null && business.getClosingTime() != null;
    }

    private boolean isInsideBusinessHours(Business business) {
        if (!hasBusinessHours(business)) {
            return true;
        }

        LocalTime now = LocalTime.now();

        return !now.isBefore(business.getOpeningTime()) && now.isBefore(business.getClosingTime());
    }

    private void createQueueClosedNotifications(ServiceQueue queue) {
        List<Ticket> waitingTickets = ticketRepository.findByQueue(queue)
                .stream()
                .filter(ticket -> ticket.getStatus() == TicketStatus.WAITING)
                .filter(ticket -> queue.getBusinessDay() == null || (ticket.getCreatedAt() != null && ticket.getCreatedAt().toLocalDate().equals(queue.getBusinessDay())))
                .sorted(Comparator.comparingInt(Ticket::getSortOrder))
                .toList();

        for (Ticket ticket : waitingTickets) {
            createNotificationSafely(
                    ticket.getUser(),
                    ticket,
                    NotificationType.QUEUE_CLOSED,
                    "La coda è stata chiusa. Il tuo ticket numero " + ticket.getTicketNumber() + " è ancora registrato ma la coda non accetta nuovi turni"
            );
        }
    }

    private void createQueueReopenedNotifications(ServiceQueue queue) {
        createNotificationSafely(
                queue.getBusiness().getOwner(),
                null,
                NotificationType.QUEUE_REOPENED,
                "La coda di " + queue.getBusiness().getName() + " è aperta e può accettare ticket"
        );

        List<Ticket> waitingTickets = ticketRepository.findByQueue(queue)
                .stream()
                .filter(ticket -> ticket.getStatus() == TicketStatus.WAITING)
                .filter(ticket -> queue.getBusinessDay() == null || (ticket.getCreatedAt() != null && ticket.getCreatedAt().toLocalDate().equals(queue.getBusinessDay())))
                .sorted(Comparator.comparingInt(Ticket::getSortOrder))
                .toList();

        for (Ticket ticket : waitingTickets) {
            createNotificationSafely(
                    ticket.getUser(),
                    ticket,
                    NotificationType.QUEUE_REOPENED,
                    "La coda di " + queue.getBusiness().getName() + " è stata riaperta. Il tuo ticket #" + ticket.getTicketNumber() + " è ancora valido"
            );
        }
    }

    private void createQueueResetNotifications(ServiceQueue queue, List<Ticket> affectedTickets, User currentUser) {
        createNotificationSafely(
                currentUser,
                null,
                NotificationType.QUEUE_RESET,
                "Hai resettato la coda di " + queue.getBusiness().getName() + ". I numeri ripartono da zero"
        );

        for (Ticket ticket : affectedTickets) {
            createNotificationSafely(
                    ticket.getUser(),
                    ticket,
                    NotificationType.QUEUE_RESET,
                    "La coda di " + queue.getBusiness().getName() + " è stata resettata. Il ticket #" + ticket.getTicketNumber() + " non è più attivo"
            );
        }
    }

    private void createNotificationSafely(User user, Ticket ticket, NotificationType type, String message) {
        try {
            notificationService.createNotification(user, ticket, type, message);
        } catch (Exception ignored) {
            // Le notifiche non devono bloccare le azioni principali sulla coda.
        }
    }


    private void checkBusinessOwner(Business business, User currentUser) {
        if (currentUser.getRole() != Role.MANAGER) {
            throw new RuntimeException("Solo un manager può gestire la coda");
        }

        if (business.getOwner().getId() != currentUser.getId()) {
            throw new RuntimeException("Non puoi gestire questa attività");
        }
    }
}
