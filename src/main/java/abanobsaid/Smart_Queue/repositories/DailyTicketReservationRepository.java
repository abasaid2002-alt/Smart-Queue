package abanobsaid.Smart_Queue.repositories;

import abanobsaid.Smart_Queue.entities.Business;
import abanobsaid.Smart_Queue.entities.DailyTicketReservation;
import abanobsaid.Smart_Queue.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;

public interface DailyTicketReservationRepository extends JpaRepository<DailyTicketReservation, Long> {

    boolean existsByUserAndBusinessAndReservationDate(User user, Business business, LocalDate reservationDate);

    void deleteByBusinessAndReservationDate(Business business, LocalDate reservationDate);
}
