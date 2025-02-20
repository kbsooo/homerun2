package homerun2.backend.repository;

import homerun2.backend.entity.MessageReadStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MessageReadStatusRepository extends JpaRepository<MessageReadStatus, Long> {
    Optional<MessageReadStatus> findByMessageIdAndUserId(Long messageId, Long userId);

    @Query("SELECT mrs.message.id FROM MessageReadStatus mrs " +
            "WHERE mrs.userId = :userId " +
            "AND mrs.message.chatRoom.id = :chatRoomId " +
            "AND mrs.isRead = false")
    List<Long> findUnreadMessageIds(@Param("userId") Long userId, @Param("chatRoomId") Long chatRoomId);

    @Query("SELECT COUNT(mrs) FROM MessageReadStatus mrs " +
            "WHERE mrs.userId = :userId " +
            "AND mrs.message.chatRoom.id = :chatRoomId " +
            "AND mrs.isRead = false")
    int countUnreadMessages(@Param("userId") Long userId, @Param("chatRoomId") Long chatRoomId);
}