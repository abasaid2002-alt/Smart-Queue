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
@Table(name = "queues")
public class ServiceQueue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    private int currentNumber;
    private int lastNumber;

    @Enumerated(EnumType.STRING)
    private QueueStatus status;

    private LocalDateTime createdAt;

    @Column(name = "business_day")
    private LocalDate businessDay;

    @Column(name = "manually_paused")
    private boolean manuallyPaused = false;

    @Column(name = "last_automatic_sync_at")
    private LocalDateTime lastAutomaticSyncAt;

    @OneToOne
    @JoinColumn(name = "business_id", nullable = false, unique = true)
    private Business business;

    public ServiceQueue(Business business) {
        this.business = business;
        this.currentNumber = 0;
        this.lastNumber = 0;
        this.status = QueueStatus.OPEN;
        this.manuallyPaused = false;
    }

    @PrePersist
    public void setCreatedAt() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }
}
