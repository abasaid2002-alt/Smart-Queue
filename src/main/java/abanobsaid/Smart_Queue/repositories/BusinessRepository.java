package abanobsaid.Smart_Queue.repositories;

import abanobsaid.Smart_Queue.entities.Business;
import abanobsaid.Smart_Queue.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BusinessRepository extends JpaRepository<Business, Long> {

    List<Business> findByOwner(User owner);
}