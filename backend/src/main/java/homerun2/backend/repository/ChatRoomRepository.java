package homerun2.backend.repository;

import homerun2.backend.entity.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {
    @Query("SELECT cr FROM ChatRoom cr " +
           "JOIN ChatRoomMember crm ON cr.id = crm.chatRoom.id " +
           "WHERE crm.userId = :userId " +
           "ORDER BY cr.updatedAt DESC")
    List<ChatRoom> findAllByUserId(@Param("userId") Long userId);
} 