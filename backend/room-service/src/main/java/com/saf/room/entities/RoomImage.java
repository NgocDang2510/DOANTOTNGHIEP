package com.saf.room.entities;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "room_images")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @Column(nullable = false)
    private String imageUrl;

    @Builder.Default
    private Boolean isPrimary = false;

    private Integer displayOrder;
}
