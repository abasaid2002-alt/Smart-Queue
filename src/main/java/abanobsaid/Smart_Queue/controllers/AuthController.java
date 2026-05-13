package abanobsaid.Smart_Queue.controllers;

import abanobsaid.Smart_Queue.entities.User;
import abanobsaid.Smart_Queue.payloads.LoginResponseDTO;
import abanobsaid.Smart_Queue.payloads.UserLoginDTO;
import abanobsaid.Smart_Queue.payloads.UserRegisterDTO;
import abanobsaid.Smart_Queue.payloads.UserResponseDTO;
import abanobsaid.Smart_Queue.services.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponseDTO register(@RequestBody @Valid UserRegisterDTO body) {
        User savedUser = authService.register(body);

        return new UserResponseDTO(
                savedUser.getId(),
                savedUser.getName(),
                savedUser.getSurname(),
                savedUser.getEmail(),
                savedUser.getRole()
        );
    }

    @PostMapping("/login")
    public LoginResponseDTO login(@RequestBody @Valid UserLoginDTO body) {
        String token = authService.login(body);
        return new LoginResponseDTO(token);
    }
}