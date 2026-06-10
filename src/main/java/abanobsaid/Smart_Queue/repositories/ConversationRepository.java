package abanobsaid.Smart_Queue.repositories;

import abanobsaid.Smart_Queue.entities.Conversation;
import abanobsaid.Smart_Queue.entities.Ticket;
import abanobsaid.Smart_Queue.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    Optional<Conversation> findByTicket(Ticket ticket);

    List<Conversation> findByCustomerOrderByLastMessageAtDesc(User customer);

    List<Conversation> findByManagerOrderByLastMessageAtDesc(User manager);
}
