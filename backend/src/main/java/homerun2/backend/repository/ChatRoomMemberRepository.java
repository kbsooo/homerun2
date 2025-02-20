package homerun2.backend.repository;

import homerun2.backend.entity.ChatRoomMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatRoomMemberRepository extends JpaRepository<ChatRoomMember, Long> {
    boolean existsByChatRoomIdAndUserId(Long chatRoomId, Long userId);

    int countByChatRoomId(Long chatRoomId);

    Optional<ChatRoomMember> findByChatRoomIdAndUserId(Long chatRoomId, Long userId);

    List<ChatRoomMember> findAllByChatRoomId(Long chatRoomId);
}