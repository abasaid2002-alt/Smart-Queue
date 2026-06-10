package abanobsaid.Smart_Queue.repositories;

import abanobsaid.Smart_Queue.entities.Business;
import abanobsaid.Smart_Queue.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BusinessRepository extends JpaRepository<Business, Long> {

    List<Business> findByOwner(User owner);

    @Query("select b from Business b where b.active = true or b.active is null")
    List<Business> findActiveBusinesses();

    @Query("select b from Business b where b.owner = :owner and (b.active = true or b.active is null)")
    List<Business> findActiveBusinessesByOwner(@Param("owner") User owner);
}
