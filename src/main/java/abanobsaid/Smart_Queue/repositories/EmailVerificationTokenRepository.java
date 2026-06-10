package abanobsaid.Smart_Queue.repositories;

import abanobsaid.Smart_Queue.entities.EmailVerificationToken;
import abanobsaid.Smart_Queue.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, Long> {

    Optional<EmailVerificationToken> findByTokenHash(String tokenHash);

    List<EmailVerificationToken> findByUserAndUsedAtIsNull(User user);

    void deleteByExpiresAtBefore(LocalDateTime dateTime);
}