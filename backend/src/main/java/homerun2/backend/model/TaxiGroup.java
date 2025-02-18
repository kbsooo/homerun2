package homerun2.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@Table(name = "taxi_groups")
public class TaxiGroup {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String groupId;

    private String destination;

    @ElementCollection
    @CollectionTable(name = "taxi_group_members", joinColumns = @JoinColumn(name = "group_id"))
    private List<String> members = new ArrayList<>();

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    private LocalDateTime expiresAt;
    private LocalDateTime deletedAt;

    @Enumerated(EnumType.STRING)
    private GroupStatus status;

    private boolean isActive;

    public enum GroupStatus {
        WAITING, // 대기중
        COMPLETE, // 4명 모집 완료
        PARTIAL, // 일부 인원으로 시작
        FAILED, // 모집 실패
        EXPIRED // 만료됨
    }

    public TaxiGroup(String groupId, String destination, String firstMember) {
        this.groupId = groupId;
        this.destination = destination;
        this.members.add(firstMember);
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
        this.expiresAt = now.plusHours(1);
        this.deletedAt = now.plusDays(1);
        this.status = GroupStatus.WAITING;
        this.isActive = true;
    }

    public boolean isFull() {
        return members.size() >= 4;
    }

    public boolean isEmpty() {
        return members.isEmpty();
    }

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }

    public boolean shouldBeDeleted() {
        return LocalDateTime.now().isAfter(deletedAt);
    }

    public void addMember(String userId) {
        if (!members.contains(userId)) {
            members.add(userId);
            this.updatedAt = LocalDateTime.now();
        }
    }

    public void removeMember(String userId) {
        if (members.remove(userId)) {
            this.updatedAt = LocalDateTime.now();
        }
    }

    public int getMemberCount() {
        return members.size();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}