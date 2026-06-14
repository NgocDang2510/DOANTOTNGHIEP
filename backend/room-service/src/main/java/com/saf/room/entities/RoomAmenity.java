package com.saf.room.entities;

import com.saf.room.entities.enums.AmenityType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "room_amenities")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomAmenity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AmenityType amenityType;
}
