package abanobsaid.Smart_Queue.controllers;

import abanobsaid.Smart_Queue.entities.Conversation;
import abanobsaid.Smart_Queue.entities.ConversationMessage;
import abanobsaid.Smart_Queue.entities.User;
import abanobsaid.Smart_Queue.payloads.ConversationMessageRequestDTO;
import abanobsaid.Smart_Queue.payloads.ConversationMessageResponseDTO;
import abanobsaid.Smart_Queue.payloads.ConversationResponseDTO;
import abanobsaid.Smart_Queue.services.ConversationService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class ConversationController {

    @Autowired
    private ConversationService conversationService;

    @GetMapping("/conversations/my")
    public List<ConversationResponseDTO> getMyConversations(@AuthenticationPrincipal User currentUser) {
        return conversationService.getMyConversations(currentUser)
                .stream()
                .map(this::toConversationResponse)
                .toList();
    }

    @PostMapping("/tickets/{ticketId}/conversation")
    @ResponseStatus(HttpStatus.CREATED)
    public ConversationResponseDTO getOrCreateConversation(
            @PathVariable long ticketId,
            @AuthenticationPrincipal User currentUser
    ) {
        return toConversationResponse(conversationService.getOrCreateConversationByTicket(ticketId, currentUser));
    }

    @GetMapping("/conversations/{conversationId}/messages")
    public List<ConversationMessageResponseDTO> getMessages(
            @PathVariable long conversationId,
            @AuthenticationPrincipal User currentUser
    ) {
        return conversationService.getMessages(conversationId, currentUser)
                .stream()
                .map(this::toMessageResponse)
                .toList();
    }

    @PostMapping("/conversations/{conversationId}/messages")
    @ResponseStatus(HttpStatus.CREATED)
    public ConversationMessageResponseDTO sendMessage(
            @PathVariable long conversationId,
            @RequestBody @Valid ConversationMessageRequestDTO body,
            @AuthenticationPrincipal User currentUser
    ) {
        ConversationMessage message = conversationService.sendMessage(conversationId, body.body(), currentUser);
        return toMessageResponse(message);
    }

    private ConversationResponseDTO toConversationResponse(Conversation conversation) {
        Long ticketId = conversation.getTicket() != null ? conversation.getTicket().getId() : null;
        Integer ticketNumber = conversation.getTicket() != null ? conversation.getTicket().getTicketNumber() : null;

        return new ConversationResponseDTO(
                conversation.getId(),
                conversation.getBusiness().getId(),
                conversation.getBusiness().getName(),
                ticketId,
                ticketNumber,
                conversation.getCustomer().getId(),
                conversation.getCustomer().getName(),
                conversation.getManager().getId(),
                conversation.getManager().getName(),
                conversationService.getLastMessagePreview(conversation),
                conversation.getLastMessageAt()
        );
    }

    private ConversationMessageResponseDTO toMessageResponse(ConversationMessage message) {
        return new ConversationMessageResponseDTO(
                message.getId(),
                message.getConversation().getId(),
                message.getSender().getId(),
                message.getSender().getName(),
                message.getBody(),
                message.getCreatedAt()
        );
    }
}
