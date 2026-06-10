package abanobsaid.Smart_Queue.services;

import abanobsaid.Smart_Queue.entities.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${app.mail.from:no-reply@smartqueue.local}")
    private String mailFrom;

    @Value("${app.frontend.reset-password-url:http://localhost:5173/reset-password}")
    private String resetPasswordUrl;

    @Value("${app.frontend.verify-email-url:http://localhost:5173/verify-email}")
    private String verifyEmailUrl;

    @Value("${app.email-verification.token-minutes:1440}")
    private long emailVerificationTokenMinutes;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendPasswordResetEmail(User user, String resetToken) {
        String resetLink = resetPasswordUrl + "?token=" + resetToken;
        String subject = "Reimposta la password - Smart Queue";
        String text = "Ciao " + user.getName() + ",\n\n" +
                "Abbiamo ricevuto una richiesta per reimpostare la password del tuo account Smart Queue.\n\n" +
                "Clicca su questo link per creare una nuova password:\n" +
                resetLink + "\n\n" +
                "Il link è valido per 15 minuti.\n\n" +
                "Se non hai richiesto tu il reset della password, puoi ignorare questa email.\n\n" +
                "Smart Queue";

        sendOrLog(user.getEmail(), subject, text, resetLink, "reset password");
    }

    public void sendEmailVerificationEmail(User user, String verificationToken) {
        String verificationLink = verifyEmailUrl + "?token=" + verificationToken;
        String subject = "Verifica la tua email - Smart Queue";
        String text = "Ciao " + user.getName() + ",\n\n" +
                "Grazie per esserti registrato su Smart Queue.\n\n" +
                "Per attivare il tuo account e confermare che questa email esiste davvero, clicca su questo link:\n" +
                verificationLink + "\n\n" +
                "Il link è valido per " + emailVerificationTokenMinutes + " minuti.\n\n" +
                "Se non hai creato tu questo account, puoi ignorare questa email.\n\n" +
                "Smart Queue";

        sendOrLog(user.getEmail(), subject, text, verificationLink, "verifica email");
    }

    private void sendOrLog(String to, String subject, String text, String link, String reason) {
        if (!mailEnabled) {
            log.info("Invio email disabilitato. Link {} per {}: {}", reason, to, link);
            return;
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailFrom);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(text);

        mailSender.send(message);
    }
}