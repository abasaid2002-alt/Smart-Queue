package abanobsaid.Smart_Queue.repositories;

import abanobsaid.Smart_Queue.entities.Notification;
import abanobsaid.Smart_Queue.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUserOrderByCreatedAtDesc(User user);

    List<Notification> findByUserAndReadFalseOrderByCreatedAtDesc(User user);
}