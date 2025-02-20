package homerun2.backend.repository;

import homerun2.backend.entity.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {
    @Query("SELECT cr FROM ChatRoom cr " +
            "JOIN ChatRoomMember crm ON cr.id = crm.chatRoom.id " +
            "WHERE crm.userId = :userId " +
            "ORDER BY cr.updatedAt DESC")
    List<ChatRoom> findAllByUserId(@Param("userId") Long userId);

    @Modifying
    @Query("UPDATE ChatRoom c SET c.isActive = false WHERE c.updatedAt < :cutoffTime AND c.isActive = true")
    int deactivateChatRoomsOlderThan(@Param("cutoffTime") LocalDateTime cutoffTime);

    @Modifying
    @Query("DELETE FROM ChatRoom c WHERE c.isActive = false AND c.updatedAt < :cutoffTime")
    int deleteInactiveChatRoomsOlderThan(@Param("cutoffTime") LocalDateTime cutoffTime);

    List<ChatRoom> findByIsActiveFalseAndUpdatedAtBefore(LocalDateTime cutoffTime);

    @Query("SELECT DISTINCT cr FROM ChatRoom cr " +
            "JOIN ChatRoomMember crm ON cr.id = crm.chatRoom.id " +
            "WHERE crm.userId = :userId " +
            "AND cr.isActive = true " +
            "AND crm.leftAt IS NULL")
    List<ChatRoom> findActiveRoomsByUserId(@Param("userId") Long userId);
}