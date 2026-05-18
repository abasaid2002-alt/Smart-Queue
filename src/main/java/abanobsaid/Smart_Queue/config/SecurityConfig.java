package abanobsaid.Smart_Queue.config;

import abanobsaid.Smart_Queue.security.JWTFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    @Autowired
    private JWTFilter jwtFilter;

    @Bean
    PasswordEncoder getBCrypt() {
        return new BCryptPasswordEncoder(11);
    }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http.csrf(AbstractHttpConfigurer::disable);

        http.sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
        );

        http.authorizeHttpRequests(request -> request

                // Auth pubblica
                .requestMatchers("/auth/**").permitAll()

                // Waiting Intelligence
                .requestMatchers(HttpMethod.GET, "/tickets/*/waiting-info").authenticated()

                // Ticket
                .requestMatchers(HttpMethod.POST, "/queues/*/tickets").authenticated()
                .requestMatchers(HttpMethod.GET, "/tickets/my").authenticated()
                .requestMatchers(HttpMethod.GET, "/queues/*/tickets").authenticated()
                .requestMatchers(HttpMethod.PATCH, "/tickets/*/cancel").authenticated()
                .requestMatchers(HttpMethod.PATCH, "/tickets/*/complete").authenticated()
                .requestMatchers(HttpMethod.PATCH, "/tickets/*/no-show").authenticated()
                .requestMatchers(HttpMethod.PATCH, "/tickets/*/smart-delay").authenticated()
                .requestMatchers(HttpMethod.PATCH, "/queues/*/next").authenticated()
                .requestMatchers(HttpMethod.PATCH, "/queues/*/undo-next").authenticated()

                // Business
                .requestMatchers(HttpMethod.GET, "/businesses").authenticated()
                .requestMatchers(HttpMethod.GET, "/businesses/my").authenticated()
                .requestMatchers(HttpMethod.GET, "/businesses/*").authenticated()
                .requestMatchers(HttpMethod.POST, "/businesses").authenticated()
                .requestMatchers(HttpMethod.PUT, "/businesses/*").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/businesses/*").authenticated()

                // Queue
                .requestMatchers(HttpMethod.POST, "/businesses/*/queue").authenticated()
                .requestMatchers(HttpMethod.GET, "/queues/*").authenticated()
                .requestMatchers(HttpMethod.GET, "/businesses/*/queue").authenticated()
                .requestMatchers(HttpMethod.PATCH, "/queues/*/open").authenticated()
                .requestMatchers(HttpMethod.PATCH, "/queues/*/close").authenticated()
                .requestMatchers(HttpMethod.PATCH, "/queues/*/reset").authenticated()

                // Tutto il resto richiede login
                .anyRequest().authenticated()
        );

        http.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}