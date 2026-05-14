package abanobsaid.Smart_Queue.repositories;

import abanobsaid.Smart_Queue.entities.ServiceQueue;
import abanobsaid.Smart_Queue.entities.Ticket;
import abanobsaid.Smart_Queue.entities.TicketStatus;
import abanobsaid.Smart_Queue.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TicketRepository extends JpaRepository<Ticket, Long> {

    List<Ticket> findByUser(User user);

    List<Ticket> findByQueue(ServiceQueue queue);

    Optional<Ticket> findFirstByQueueAndStatusOrderByTicketNumberAsc(ServiceQueue queue, TicketStatus status);

    int countByQueueAndStatusAndTicketNumberLessThan(ServiceQueue queue, TicketStatus status, int ticketNumber);
}