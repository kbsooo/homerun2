package homerun2.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Getter
@Setter
public class TaxiGroup {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String groupId; // 4자리 랜덤 숫자
    private String destination; // "명지대" or "기흥역"
    private int currentMembers;
    private LocalDateTime createdAt;
    private boolean active;

    @ElementCollection
    private Set<String> memberIds = new HashSet<>(); // Kakao user IDs

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        active = true;
    }
}