package homerun2.backend.service;

import homerun2.backend.repository.ChatRoomRepository;
import homerun2.backend.repository.TaxiGroupRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class CleanupService {
    private final TaxiGroupRepository taxiGroupRepository;
    private final ChatRoomRepository chatRoomRepository;

    // 매일 새벽 4시에 실행
    @Scheduled(cron = "0 0 4 * * *")
    @Transactional
    public void cleanupInactiveGroups() {
        LocalDateTime yesterday = LocalDateTime.now().minusDays(1);

        log.info("Starting daily cleanup of inactive groups and chat rooms...");

        try {
            // 1. 24시간 이상 지난 활성 그룹 비활성화
            int deactivatedGroups = deactivateOldGroups(yesterday);

            // 2. 비활성화된 그룹의 채팅방도 비활성화
            int deactivatedChatRooms = deactivateChatRooms(yesterday);

            log.info("Daily cleanup completed. Deactivated {} groups and {} chat rooms",
                    deactivatedGroups, deactivatedChatRooms);
        } catch (Exception e) {
            log.error("Error during daily cleanup: ", e);
        }
    }

    @Transactional
    public int deactivateOldGroups(LocalDateTime cutoffTime) {
        try {
            // 마지막 활동 시간이 cutoffTime보다 이전인 그룹들을 찾아서 비활성화
            int count = taxiGroupRepository.deactivateGroupsOlderThan(cutoffTime);
            log.info("Deactivated {} old groups", count);
            return count;
        } catch (Exception e) {
            log.error("Error deactivating old groups: ", e);
        return 0;
    }
    }

    @Transactional
    public int deactivateChatRooms(LocalDateTime cutoffTime) {
        try {
            // 비활성화된 그룹에 연결된 채팅방들을 찾아서 비활성화
            int count = chatRoomRepository.deactivateChatRoomsOlderThan(cutoffTime);
            log.info("Deactivated {} chat rooms", count);
            return count;
        } catch (Exception e) {
            log.error("Error deactivating chat rooms: ", e);
        return 0;
        }
    }

    // 일주일 이상 지난 비활성 데이터 삭제 (매주 월요일 새벽 3시)
    @Scheduled(cron = "0 0 3 * * MON")
    @Transactional
    public void deleteOldData() {
        LocalDateTime weekAgo = LocalDateTime.now().minusWeeks(1);

        try {
            log.info("Starting weekly cleanup of old inactive data...");

            // 오래된 비활성 그룹 삭제
            int deletedGroups = taxiGroupRepository.deleteInactiveGroupsOlderThan(weekAgo);

            // 오래된 비활성 채팅방 삭제
            int deletedChatRooms = chatRoomRepository.deleteInactiveChatRoomsOlderThan(weekAgo);

            log.info("Weekly cleanup completed. Deleted {} groups and {} chat rooms",
                    deletedGroups, deletedChatRooms);
        } catch (Exception e) {
            log.error("Error during weekly cleanup: ", e);
        }
    }
}