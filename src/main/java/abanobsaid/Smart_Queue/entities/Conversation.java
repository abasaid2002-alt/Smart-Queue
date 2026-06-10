package abanobsaid.Smart_Queue.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "conversations")
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @ManyToOne
    @JoinColumn(name = "business_id", nullable = false)
    private Business business;

    @OneToOne
    @JoinColumn(name = "ticket_id", unique = true)
    private Ticket ticket;

    @ManyToOne
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @ManyToOne
    @JoinColumn(name = "manager_id", nullable = false)
    private User manager;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime lastMessageAt;

    public Conversation(Business business, Ticket ticket, User customer, User manager) {
        this.business = business;
        this.ticket = ticket;
        this.customer = customer;
        this.manager = manager;
        this.createdAt = LocalDateTime.now();
        this.lastMessageAt = this.createdAt;
    }

    @PrePersist
    public void setDefaultValues() {
        LocalDateTime now = LocalDateTime.now();

        if (this.createdAt == null) {
            this.createdAt = now;
        }

        if (this.lastMessageAt == null) {
            this.lastMessageAt = now;
        }
    }
}
