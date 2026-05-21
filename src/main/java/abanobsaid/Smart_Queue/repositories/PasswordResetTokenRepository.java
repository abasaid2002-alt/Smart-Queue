package abanobsaid.Smart_Queue.repositories;

import abanobsaid.Smart_Queue.entities.PasswordResetToken;
import abanobsaid.Smart_Queue.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByTokenHash(String tokenHash);

    List<PasswordResetToken> findByUserAndUsedAtIsNull(User user);

    void deleteByExpiresAtBefore(LocalDateTime dateTime);
}