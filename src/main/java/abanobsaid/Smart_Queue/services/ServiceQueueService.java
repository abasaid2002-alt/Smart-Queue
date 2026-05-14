package abanobsaid.Smart_Queue.services;

import abanobsaid.Smart_Queue.entities.*;
import abanobsaid.Smart_Queue.repositories.ServiceQueueRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ServiceQueueService {

    @Autowired
    private ServiceQueueRepository serviceQueueRepository;

    @Autowired
    private BusinessService businessService;

    public ServiceQueue createQueue(long businessId, User currentUser) {
        Business business = businessService.findById(businessId);

        checkBusinessOwner(business, currentUser);

        if (serviceQueueRepository.existsByBusiness(business)) {
            throw new RuntimeException("Questa attività ha già una coda");
        }

        ServiceQueue newQueue = new ServiceQueue(business);

        return serviceQueueRepository.save(newQueue);
    }

    public ServiceQueue findById(long queueId) {
        return serviceQueueRepository.findById(queueId)
                .orElseThrow(() -> new RuntimeException("Coda non trovata"));
    }

    public ServiceQueue findByBusinessId(long businessId) {
        Business business = businessService.findById(businessId);

        return serviceQueueRepository.findByBusiness(business)
                .orElseThrow(() -> new RuntimeException("Questa attività non ha ancora una coda"));
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

        return serviceQueueRepository.save(queue);
    }

    public ServiceQueue resetQueue(long queueId, User currentUser) {
        ServiceQueue queue = findById(queueId);

        checkBusinessOwner(queue.getBusiness(), currentUser);

        queue.setCurrentNumber(0);
        queue.setLastNumber(0);
        queue.setStatus(QueueStatus.OPEN);

        return serviceQueueRepository.save(queue);
    }

    private void checkBusinessOwner(Business business, User currentUser) {
        if (currentUser.getRole() != Role.MANAGER) {
            throw new RuntimeException("Solo un manager può gestire una coda");
        }

        if (business.getOwner().getId() != currentUser.getId()) {
            throw new RuntimeException("Non puoi gestire la coda di questa attività");
        }
    }
}