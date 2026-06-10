package abanobsaid.Smart_Queue.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "businesses")
public class Business {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    private String name;
    private String description;
    private String address;
    private String city;
    private String category;

    @Column(name = "opening_time")
    private LocalTime openingTime;

    @Column(name = "closing_time")
    private LocalTime closingTime;

    @Column(name = "active", columnDefinition = "boolean default true")
    private Boolean active = true;

    @ManyToOne
    @JoinColumn(name = "owner_id")
    private User owner;

    public Business(String name, String description, String address, String city, String category, LocalTime openingTime, LocalTime closingTime, User owner) {
        this.name = name;
        this.description = description;
        this.address = address;
        this.city = city;
        this.category = category;
        this.openingTime = openingTime;
        this.closingTime = closingTime;
        this.owner = owner;
        this.active = true;
    }

    public Business(String name, String description, String address, String city, String category, User owner) {
        this(name, description, address, city, category, null, null, owner);
    }

    public boolean isActive() {
        return active == null || active;
    }

    @PrePersist
    public void setDefaultValues() {
        if (this.active == null) {
            this.active = true;
        }
    }
}
