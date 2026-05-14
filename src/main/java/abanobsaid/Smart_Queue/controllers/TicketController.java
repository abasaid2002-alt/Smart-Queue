package abanobsaid.Smart_Queue.controllers;

import abanobsaid.Smart_Queue.entities.Ticket;
import abanobsaid.Smart_Queue.entities.User;
import abanobsaid.Smart_Queue.payloads.TicketResponseDTO;
import abanobsaid.Smart_Queue.services.TicketService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class TicketController {

    @Autowired
    private TicketService ticketService;

    @PostMapping("/queues/{queueId}/tickets")
    @ResponseStatus(HttpStatus.CREATED)
    public TicketResponseDTO createTicket(
            @PathVariable long queueId,
            @AuthenticationPrincipal User currentUser
    ) {
        Ticket ticket = ticketService.createTicket(queueId, currentUser);
        return toResponse(ticket);
    }

    @GetMapping("/tickets/my")
    public List<TicketResponseDTO> getMyTickets(@AuthenticationPrincipal User currentUser) {
        return ticketService.getMyTickets(currentUser)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @GetMapping("/queues/{queueId}/tickets")
    public List<TicketResponseDTO> getTicketsByQueue(
            @PathVariable long queueId,
            @AuthenticationPrincipal User currentUser
    ) {
        return ticketService.getTicketsByQueue(queueId, currentUser)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @PatchMapping("/tickets/{ticketId}/cancel")
    public TicketResponseDTO cancelTicket(
            @PathVariable long ticketId,
            @AuthenticationPrincipal User currentUser
    ) {
        Ticket ticket = ticketService.cancelTicket(ticketId, currentUser);
        return toResponse(ticket);
    }

    @PatchMapping("/queues/{queueId}/next")
    public TicketResponseDTO nextTicket(
            @PathVariable long queueId,
            @AuthenticationPrincipal User currentUser
    ) {
        Ticket ticket = ticketService.nextTicket(queueId, currentUser);
        return toResponse(ticket);
    }

    private TicketResponseDTO toResponse(Ticket ticket) {
        return new TicketResponseDTO(
                ticket.getId(),
                ticket.getTicketNumber(),
                ticket.getStatus(),
                ticket.getCreatedAt(),
                ticket.getServedAt(),
                ticket.getQueue().getId(),
                ticket.getQueue().getBusiness().getId(),
                ticket.getQueue().getBusiness().getName(),
                ticket.getUser().getId(),
                ticket.getUser().getName(),
                ticket.getQueue().getCurrentNumber(),
                ticketService.calculatePeopleBefore(ticket)
        );
    }
}