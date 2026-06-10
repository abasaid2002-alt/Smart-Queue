package abanobsaid.Smart_Queue.repositories;

import abanobsaid.Smart_Queue.entities.Conversation;
import abanobsaid.Smart_Queue.entities.ConversationMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ConversationMessageRepository extends JpaRepository<ConversationMessage, Long> {

    List<ConversationMessage> findByConversationOrderByCreatedAtAsc(Conversation conversation);

    Optional<ConversationMessage> findFirstByConversationOrderByCreatedAtDesc(Conversation conversation);
}
