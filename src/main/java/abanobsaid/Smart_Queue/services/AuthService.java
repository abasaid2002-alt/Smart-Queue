package abanobsaid.Smart_Queue.services;

import abanobsaid.Smart_Queue.entities.User;
import abanobsaid.Smart_Queue.payloads.UserLoginDTO;
import abanobsaid.Smart_Queue.payloads.UserRegisterDTO;
import abanobsaid.Smart_Queue.repositories.UserRepository;
import abanobsaid.Smart_Queue.security.JWTTools;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder bcrypt;

    @Autowired
    private JWTTools jwtTools;

    public User register(UserRegisterDTO body) {
        if (userRepository.existsByEmail(body.email())) {
            throw new RuntimeException("Email già in uso");
        }

        User newUser = new User(
                body.name(),
                body.surname(),
                body.email(),
                bcrypt.encode(body.password()),
                body.role()
        );

        return userRepository.save(newUser);
    }

    public String login(UserLoginDTO body) {
        User found = userRepository.findByEmail(body.email())
                .orElseThrow(() -> new RuntimeException("Email o password non corretti"));

        if (!bcrypt.matches(body.password(), found.getPassword())) {
            throw new RuntimeException("Email o password non corretti");
        }

        return jwtTools.createToken(found);
    }
}