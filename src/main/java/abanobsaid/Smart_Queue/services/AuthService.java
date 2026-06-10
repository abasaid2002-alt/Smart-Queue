package abanobsaid.Smart_Queue.services;

import abanobsaid.Smart_Queue.entities.EmailVerificationToken;
import abanobsaid.Smart_Queue.entities.PasswordResetToken;
import abanobsaid.Smart_Queue.entities.User;
import abanobsaid.Smart_Queue.payloads.LoginResponseDTO;
import abanobsaid.Smart_Queue.payloads.MessageResponseDTO;
import abanobsaid.Smart_Queue.payloads.ResetPasswordDTO;
import abanobsaid.Smart_Queue.payloads.UserLoginDTO;
import abanobsaid.Smart_Queue.payloads.UserRegisterDTO;
import abanobsaid.Smart_Queue.repositories.EmailVerificationTokenRepository;
import abanobsaid.Smart_Queue.repositories.PasswordResetTokenRepository;
import abanobsaid.Smart_Queue.repositories.UserRepository;
import abanobsaid.Smart_Queue.security.JWTTools;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;

@Service
public class AuthService {

    private static final int RESET_TOKEN_EXPIRATION_MINUTES = 15;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private EmailVerificationTokenRepository emailVerificationTokenRepository;

    @Autowired
    private PasswordEncoder bcrypt;

    @Autowired
    private JWTTools jwtTools;

    @Autowired
    private EmailService emailService;

    @Value("${app.email-verification.token-minutes:1440}")
    private long emailVerificationTokenMinutes;

    @Transactional
    public User register(UserRegisterDTO body) {
        String normalizedEmail = normalizeEmail(body.email());

        validateStrongPassword(body.password());

        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Email già registrata"
            );
        }

        User newUser = new User(
                body.name().trim(),
                body.surname().trim(),
                normalizedEmail,
                bcrypt.encode(body.password()),
                body.role()
        );

        newUser.setEmailVerified(false);

        User savedUser = userRepository.save(newUser);

        try {
            createAndSendEmailVerification(savedUser);
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Account non creato: errore durante l'invio dell'email di verifica. Controlla la configurazione SMTP."
            );
        }

        return savedUser;
    }

    public LoginResponseDTO login(UserLoginDTO body) {
        String normalizedEmail = normalizeEmail(body.email());

        User found = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Email o password non corretti"
                ));

        if (!bcrypt.matches(body.password(), found.getPassword())) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Email o password non corretti"
            );
        }

        if (!found.isEmailVerified()) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Email non verificata. Controlla la tua casella email e clicca il link di attivazione prima di accedere."
            );
        }

        String token = jwtTools.createToken(found);

        return new LoginResponseDTO(
                token,
                found.getId(),
                found.getName(),
                found.getSurname(),
                found.getEmail(),
                found.getRole()
        );
    }

    @Transactional
    public MessageResponseDTO verifyEmail(String plainToken) {
        String tokenHash = hashToken(plainToken);

        EmailVerificationToken verificationToken = emailVerificationTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Token di verifica non valido o scaduto"
                ));

        if (verificationToken.isUsed()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Token di verifica già utilizzato"
            );
        }

        if (verificationToken.isExpired()) {
            verificationToken.markAsUsed();
            emailVerificationTokenRepository.save(verificationToken);

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Token di verifica scaduto. Richiedi un nuovo link di verifica."
            );
        }

        User user = verificationToken.getUser();
        user.setEmailVerified(true);
        userRepository.save(user);

        verificationToken.markAsUsed();
        emailVerificationTokenRepository.save(verificationToken);

        return new MessageResponseDTO("Email verificata correttamente. Ora puoi effettuare il login.");
    }

    @Transactional
    public MessageResponseDTO resendVerificationEmail(String email) {
        String normalizedEmail = normalizeEmail(email);
        String safeMessage = "Se l'indirizzo email è registrato e non ancora verificato, riceverai un nuovo link di verifica.";

        User user = userRepository.findByEmailIgnoreCase(normalizedEmail).orElse(null);

        if (user == null || user.isEmailVerified()) {
            return new MessageResponseDTO(safeMessage);
        }

        try {
            createAndSendEmailVerification(user);
        } catch (Exception ex) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Errore durante l'invio dell'email di verifica. Riprova più tardi."
            );
        }

        return new MessageResponseDTO(safeMessage);
    }

    @Transactional
    public MessageResponseDTO forgotPassword(String email) {
        String normalizedEmail = normalizeEmail(email);

        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElse(null);

        String safeMessage = "Se l'indirizzo email è registrato, riceverai un link per reimpostare la password.";

        if (user == null) {
            return new MessageResponseDTO(safeMessage);
        }

        List<PasswordResetToken> activeTokens =
                passwordResetTokenRepository.findByUserAndUsedAtIsNull(user);

        for (PasswordResetToken activeToken : activeTokens) {
            activeToken.markAsUsed();
        }

        passwordResetTokenRepository.saveAll(activeTokens);

        String plainToken = generateSecureToken();
        String tokenHash = hashToken(plainToken);

        PasswordResetToken resetToken = new PasswordResetToken(
                tokenHash,
                user,
                LocalDateTime.now().plusMinutes(RESET_TOKEN_EXPIRATION_MINUTES)
        );

        passwordResetTokenRepository.save(resetToken);

        try {
            emailService.sendPasswordResetEmail(user, plainToken);
        } catch (Exception ex) {
            resetToken.markAsUsed();
            passwordResetTokenRepository.save(resetToken);

            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Errore durante l'invio dell'email. Riprova più tardi."
            );
        }

        return new MessageResponseDTO(safeMessage);
    }

    @Transactional
    public MessageResponseDTO resetPassword(ResetPasswordDTO body) {
        String tokenHash = hashToken(body.token());

        PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Token non valido o scaduto"
                ));

        if (resetToken.isUsed()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Token già utilizzato"
            );
        }

        if (resetToken.isExpired()) {
            resetToken.markAsUsed();
            passwordResetTokenRepository.save(resetToken);

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Token scaduto"
            );
        }

        validateStrongPassword(body.newPassword());

        User user = resetToken.getUser();

        if (bcrypt.matches(body.newPassword(), user.getPassword())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La nuova password deve essere diversa dalla precedente"
            );
        }

        user.setPassword(bcrypt.encode(body.newPassword()));
        userRepository.save(user);

        resetToken.markAsUsed();
        passwordResetTokenRepository.save(resetToken);

        return new MessageResponseDTO("Password aggiornata con successo");
    }

    private void createAndSendEmailVerification(User user) {
        List<EmailVerificationToken> activeTokens =
                emailVerificationTokenRepository.findByUserAndUsedAtIsNull(user);

        for (EmailVerificationToken activeToken : activeTokens) {
            activeToken.markAsUsed();
        }

        emailVerificationTokenRepository.saveAll(activeTokens);

        String plainToken = generateSecureToken();
        String tokenHash = hashToken(plainToken);

        EmailVerificationToken verificationToken = new EmailVerificationToken(
                tokenHash,
                user,
                LocalDateTime.now().plusMinutes(emailVerificationTokenMinutes)
        );

        emailVerificationTokenRepository.save(verificationToken);
        emailService.sendEmailVerificationEmail(user, plainToken);
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String generateSecureToken() {
        byte[] randomBytes = new byte[32];
        new SecureRandom().nextBytes(randomBytes);

        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(randomBytes);
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));

            return HexFormat.of().formatHex(hash);
        } catch (Exception ex) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Errore nella generazione del token"
            );
        }
    }

    private void validateStrongPassword(String password) {
        if (password == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La password è obbligatoria");
        }

        if (password.length() < 8 || password.length() > 72) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La password deve avere tra 8 e 72 caratteri"
            );
        }

        if (password.contains(" ")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La password non deve contenere spazi"
            );
        }

        if (!password.matches(".*[A-Z].*")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La password deve contenere almeno una lettera maiuscola"
            );
        }

        if (!password.matches(".*[a-z].*")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La password deve contenere almeno una lettera minuscola"
            );
        }

        if (!password.matches(".*\\d.*")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La password deve contenere almeno un numero"
            );
        }

        if (!password.matches(".*[^A-Za-z0-9].*")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La password deve contenere almeno un carattere speciale"
            );
        }
    }
}