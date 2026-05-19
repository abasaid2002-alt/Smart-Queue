package abanobsaid.Smart_Queue.controllers;

import abanobsaid.Smart_Queue.entities.ServiceQueue;
import abanobsaid.Smart_Queue.entities.User;
import abanobsaid.Smart_Queue.payloads.QueueResponseDTO;
import abanobsaid.Smart_Queue.services.ServiceQueueService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
public class ServiceQueueController {

    @Autowired
    private ServiceQueueService serviceQueueService;

    @PostMapping("/businesses/{businessId}/queue")
    @ResponseStatus(HttpStatus.CREATED)
    public QueueResponseDTO createQueue(
            @PathVariable long businessId,
            @AuthenticationPrincipal User currentUser
    ) {
        ServiceQueue queue = serviceQueueService.createQueue(businessId, currentUser);
        return toResponse(queue);
    }

    @GetMapping("/queues/{queueId}")
    public QueueResponseDTO getQueueById(@PathVariable long queueId) {
        ServiceQueue queue = serviceQueueService.findById(queueId);
        return toResponse(queue);
    }

    @GetMapping("/businesses/{businessId}/queue")
    public QueueResponseDTO getQueueByBusinessId(
            @PathVariable long businessId,
            @AuthenticationPrincipal User currentUser
    ) {
        ServiceQueue queue = serviceQueueService.findByBusinessId(businessId, currentUser);
        return toResponse(queue);
    }

    @PatchMapping("/queues/{queueId}/open")
    public QueueResponseDTO openQueue(
            @PathVariable long queueId,
            @AuthenticationPrincipal User currentUser
    ) {
        ServiceQueue queue = serviceQueueService.openQueue(queueId, currentUser);
        return toResponse(queue);
    }

    @PatchMapping("/queues/{queueId}/close")
    public QueueResponseDTO closeQueue(
            @PathVariable long queueId,
            @AuthenticationPrincipal User currentUser
    ) {
        ServiceQueue queue = serviceQueueService.closeQueue(queueId, currentUser);
        return toResponse(queue);
    }

    @PatchMapping("/queues/{queueId}/reset")
    public QueueResponseDTO resetQueue(
            @PathVariable long queueId,
            @AuthenticationPrincipal User currentUser
    ) {
        ServiceQueue queue = serviceQueueService.resetQueue(queueId, currentUser);
        return toResponse(queue);
    }

    private QueueResponseDTO toResponse(ServiceQueue queue) {
        return new QueueResponseDTO(
                queue.getId(),
                queue.getCurrentNumber(),
                queue.getLastNumber(),
                queue.getStatus(),
                queue.getCreatedAt(),
                queue.getBusiness().getId(),
                queue.getBusiness().getName()
        );
    }
}