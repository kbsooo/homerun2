package homerun2.backend.service;

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

    private int deactivateOldGroups(LocalDateTime cutoffTime) {
        // TODO: 구현 필요
        // 1. 마지막 활동 시간이 cutoffTime보다 이전인 그룹들을 찾아서
        // 2. is_active = false로 설정
        return 0;
    }

    private int deactivateChatRooms(LocalDateTime cutoffTime) {
        // TODO: 구현 필요
        // 1. 비활성화된 그룹에 연결된 채팅방들을 찾아서
        // 2. is_active = false로 설정
        return 0;
    }
}