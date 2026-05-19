package abanobsaid.Smart_Queue.services;

import abanobsaid.Smart_Queue.entities.*;
import abanobsaid.Smart_Queue.repositories.ServiceQueueRepository;
import abanobsaid.Smart_Queue.repositories.TicketRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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
    private NotificationService notificationService;

    public ServiceQueue createQueue(long businessId, User currentUser) {
        Business business = businessService.findById(businessId);

        checkBusinessOwner(business, currentUser);

        ServiceQueue queue = new ServiceQueue();
        queue.setBusiness(business);
        queue.setStatus(QueueStatus.OPEN);
        queue.setCurrentNumber(0);
        queue.setLastNumber(0);

        return serviceQueueRepository.save(queue);
    }

    public ServiceQueue findById(long queueId) {
        return serviceQueueRepository.findById(queueId)
                .orElseThrow(() -> new RuntimeException("Coda non trovata"));
    }

    public ServiceQueue getQueueById(long queueId, User currentUser) {
        ServiceQueue queue = findById(queueId);

        checkBusinessOwner(queue.getBusiness(), currentUser);

        return queue;
    }

    public ServiceQueue getQueueByBusiness(long businessId, User currentUser) {
        Business business = businessService.findById(businessId);

        checkBusinessOwner(business, currentUser);

        return serviceQueueRepository.findByBusiness(business)
                .orElseThrow(() -> new RuntimeException("Coda non trovata"));
    }

    // Metodo aggiunto per compatibilità con il controller attuale
    public ServiceQueue findByBusinessId(long businessId, User currentUser) {
        return getQueueByBusiness(businessId, currentUser);
    }

    public ServiceQueue openQueue(long queueId, User currentUser) {
        ServiceQueue queue = findById(queueId);

        checkBusinessOwner(queue.getBusiness(), currentUser);

        queue.setStatus(QueueStatus.OPEN);

        return serviceQueueRepository.save(queue);
    }

    public ServiceQueue closeQueue(long queueId, User currentUser) {
        ServiceQueue queue = findById(queueId);

        checkBusinessOwner(queue.getBusiness(), currentUser);

        queue.setStatus(QueueStatus.CLOSED);

        ServiceQueue savedQueue = serviceQueueRepository.save(queue);

        createQueueClosedNotifications(savedQueue);

        return savedQueue;
    }

    public ServiceQueue resetQueue(long queueId, User currentUser) {
        ServiceQueue queue = findById(queueId);

        checkBusinessOwner(queue.getBusiness(), currentUser);

        List<Ticket> tickets = ticketRepository.findByQueue(queue);

        ticketRepository.deleteAll(tickets);

        queue.setCurrentNumber(0);
        queue.setLastNumber(0);
        queue.setStatus(QueueStatus.OPEN);

        return serviceQueueRepository.save(queue);
    }

    private void createQueueClosedNotifications(ServiceQueue queue) {
        List<Ticket> waitingTickets = ticketRepository.findByQueue(queue)
                .stream()
                .filter(ticket -> ticket.getStatus() == TicketStatus.WAITING)
                .sorted(Comparator.comparingInt(Ticket::getSortOrder))
                .toList();

        for (Ticket ticket : waitingTickets) {
            notificationService.createNotification(
                    ticket.getUser(),
                    ticket,
                    NotificationType.QUEUE_CLOSED,
                    "La coda è stata chiusa. Il tuo ticket numero " + ticket.getTicketNumber() + " è ancora registrato ma la coda non accetta nuovi turni"
            );
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