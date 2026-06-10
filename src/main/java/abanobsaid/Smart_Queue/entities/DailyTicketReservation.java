package abanobsaid.Smart_Queue.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(
        name = "daily_ticket_reservations",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_daily_ticket_reservation_user_business_date",
                columnNames = {"user_id", "business_id", "reservation_date"}
        )
)
public class DailyTicketReservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "business_id", nullable = false)
    private Business business;

    @Column(name = "reservation_date", nullable = false)
    private LocalDate reservationDate;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public DailyTicketReservation(User user, Business business, LocalDate reservationDate) {
        this.user = user;
        this.business = business;
        this.reservationDate = reservationDate;
        this.createdAt = LocalDateTime.now();
    }

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
