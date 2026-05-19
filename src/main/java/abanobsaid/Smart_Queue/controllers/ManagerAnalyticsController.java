package abanobsaid.Smart_Queue.controllers;

import abanobsaid.Smart_Queue.entities.User;
import abanobsaid.Smart_Queue.payloads.ManagerAnalyticsResponseDTO;
import abanobsaid.Smart_Queue.services.ManagerAnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
public class ManagerAnalyticsController {

    @Autowired
    private ManagerAnalyticsService managerAnalyticsService;

    @GetMapping("/queues/{queueId}/analytics")
    public ManagerAnalyticsResponseDTO getQueueAnalytics(
            @PathVariable long queueId,
            @AuthenticationPrincipal User currentUser
    ) {
        return managerAnalyticsService.getQueueAnalytics(queueId, currentUser);
    }
}