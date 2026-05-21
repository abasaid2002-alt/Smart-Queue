package abanobsaid.Smart_Queue.controllers;

import abanobsaid.Smart_Queue.entities.User;
import abanobsaid.Smart_Queue.payloads.ForgotPasswordDTO;
import abanobsaid.Smart_Queue.payloads.LoginResponseDTO;
import abanobsaid.Smart_Queue.payloads.MessageResponseDTO;
import abanobsaid.Smart_Queue.payloads.ResetPasswordDTO;
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
        return authService.login(body);
    }

    @PostMapping("/forgot-password")
    public MessageResponseDTO forgotPassword(@RequestBody @Valid ForgotPasswordDTO body) {
        return authService.forgotPassword(body.email());
    }

    @PostMapping("/reset-password")
    public MessageResponseDTO resetPassword(@RequestBody @Valid ResetPasswordDTO body) {
        return authService.resetPassword(body);
    }
}