package abanobsaid.Smart_Queue.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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

    @ManyToOne
    @JoinColumn(name = "owner_id")
    private User owner;

    public Business(String name, String description, String address, String city, String category, User owner) {
        this.name = name;
        this.description = description;
        this.address = address;
        this.city = city;
        this.category = category;
        this.owner = owner;
    }
}