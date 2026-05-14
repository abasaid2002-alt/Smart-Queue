package abanobsaid.Smart_Queue.repositories;

import abanobsaid.Smart_Queue.entities.Business;
import abanobsaid.Smart_Queue.entities.ServiceQueue;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ServiceQueueRepository extends JpaRepository<ServiceQueue, Long> {

    Optional<ServiceQueue> findByBusiness(Business business);

    boolean existsByBusiness(Business business);
}