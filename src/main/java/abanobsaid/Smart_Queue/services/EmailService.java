package abanobsaid.Smart_Queue.services;

import abanobsaid.Smart_Queue.entities.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String mailFrom;

    @Value("${app.frontend.reset-password-url}")
    private String resetPasswordUrl;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendPasswordResetEmail(User user, String resetToken) {
        String resetLink = resetPasswordUrl + "?token=" + resetToken;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailFrom);
        message.setTo(user.getEmail());
        message.setSubject("Reimposta la password - Smart Queue");
        message.setText(
                "Ciao " + user.getName() + ",\n\n" +
                        "Abbiamo ricevuto una richiesta per reimpostare la password del tuo account Smart Queue.\n\n" +
                        "Clicca su questo link per creare una nuova password:\n" +
                        resetLink + "\n\n" +
                        "Il link è valido per 15 minuti.\n\n" +
                        "Se non hai richiesto tu il reset della password, puoi ignorare questa email.\n\n" +
                        "Smart Queue"
        );

        mailSender.send(message);
    }
}