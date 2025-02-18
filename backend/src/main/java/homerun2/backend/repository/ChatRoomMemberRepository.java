package homerun2.backend.repository;

import homerun2.backend.entity.ChatRoomMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ChatRoomMemberRepository extends JpaRepository<ChatRoomMember, Long> {
    boolean existsByChatRoomIdAndUserId(Long chatRoomId, Long userId);
    int countByChatRoomId(Long chatRoomId);
} 