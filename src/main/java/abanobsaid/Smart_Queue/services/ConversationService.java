package abanobsaid.Smart_Queue.services;

import abanobsaid.Smart_Queue.entities.*;
import abanobsaid.Smart_Queue.repositories.ConversationMessageRepository;
import abanobsaid.Smart_Queue.repositories.ConversationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ConversationService {

    @Autowired
    private ConversationRepository conversationRepository;

    @Autowired
    private ConversationMessageRepository conversationMessageRepository;

    @Autowired
    private TicketService ticketService;

    @Autowired
    private NotificationService notificationService;

    public List<Conversation> getMyConversations(User currentUser) {
        if (currentUser.getRole() == Role.MANAGER) {
            return conversationRepository.findByManagerOrderByLastMessageAtDesc(currentUser);
        }

        return conversationRepository.findByCustomerOrderByLastMessageAtDesc(currentUser);
    }

    @Transactional
    public Conversation getOrCreateConversationByTicket(long ticketId, User currentUser) {
        Ticket ticket = ticketService.findById(ticketId);
        checkTicketAccess(ticket, currentUser);

        return conversationRepository.findByTicket(ticket)
                .orElseGet(() -> conversationRepository.save(new Conversation(
                        ticket.getQueue().getBusiness(),
                        ticket,
                        ticket.getUser(),
                        ticket.getQueue().getBusiness().getOwner()
                )));
    }

    public Conversation findConversation(long conversationId, User currentUser) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversazione non trovata"));

        checkConversationAccess(conversation, currentUser);

        return conversation;
    }

    public List<ConversationMessage> getMessages(long conversationId, User currentUser) {
        Conversation conversation = findConversation(conversationId, currentUser);
        return conversationMessageRepository.findByConversationOrderByCreatedAtAsc(conversation);
    }

    @Transactional
    public ConversationMessage sendMessage(long conversationId, String body, User currentUser) {
        Conversation conversation = findConversation(conversationId, currentUser);
        String cleanBody = body == null ? "" : body.trim();

        if (cleanBody.isBlank()) {
            throw new RuntimeException("Il messaggio non può essere vuoto");
        }

        if (cleanBody.length() > 1000) {
            throw new RuntimeException("Il messaggio può contenere massimo 1000 caratteri");
        }

        ConversationMessage message = conversationMessageRepository.save(new ConversationMessage(conversation, currentUser, cleanBody));

        conversation.setLastMessageAt(LocalDateTime.now());
        conversationRepository.save(conversation);

        User recipient = conversation.getCustomer().getId() == currentUser.getId()
                ? conversation.getManager()
                : conversation.getCustomer();

        createNotificationAfterCommit(
                recipient,
                conversation.getTicket(),
                NotificationType.MESSAGE_RECEIVED,
                currentUser.getName() + " ti ha inviato un messaggio su " + conversation.getBusiness().getName()
        );

        return message;
    }

    private void createNotificationAfterCommit(User user, Ticket ticket, NotificationType type, String message) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    createNotificationSafely(user, ticket, type, message);
                }
            });

            return;
        }

        createNotificationSafely(user, ticket, type, message);
    }

    private void createNotificationSafely(User user, Ticket ticket, NotificationType type, String message) {
        try {
            notificationService.createNotification(user, ticket, type, message);
        } catch (Exception ignored) {
            // Il messaggio deve restare inviato anche se la notifica automatica non viene creata.
        }
    }


    public String getLastMessagePreview(Conversation conversation) {
        return conversationMessageRepository.findFirstByConversationOrderByCreatedAtDesc(conversation)
                .map(ConversationMessage::getBody)
                .orElse("Nessun messaggio ancora");
    }

    private void checkTicketAccess(Ticket ticket, User currentUser) {
        boolean isTicketOwner = ticket.getUser().getId() == currentUser.getId();
        boolean isBusinessManager = currentUser.getRole() == Role.MANAGER
                && ticket.getQueue().getBusiness().getOwner().getId() == currentUser.getId();

        if (!isTicketOwner && !isBusinessManager) {
            throw new RuntimeException("Non puoi aprire questa conversazione");
        }
    }

    private void checkConversationAccess(Conversation conversation, User currentUser) {
        boolean isCustomer = conversation.getCustomer().getId() == currentUser.getId();
        boolean isManager = conversation.getManager().getId() == currentUser.getId();

        if (!isCustomer && !isManager) {
            throw new RuntimeException("Non puoi accedere a questa conversazione");
        }
    }
}
