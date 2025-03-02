package homerun2.backend.service;

import homerun2.backend.model.TaxiGroup;
import homerun2.backend.repository.TaxiGroupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class TaxiGroupService {
    private final TaxiGroupRepository taxiGroupRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final Random random = new Random();

    @Transactional
    public TaxiGroup joinOrCreateGroup(String userId, String destination) {
        // Check if user is already in an active group
        List<TaxiGroup> activeGroups = taxiGroupRepository.findByIsActiveTrueAndMembersContaining(userId);
        if (!activeGroups.isEmpty()) {
            throw new IllegalStateException("ALREADY_IN_GROUP");
        }

        // Try to find an existing waiting group
        TaxiGroup group = taxiGroupRepository.findFirstByDestinationAndStatusAndIsActiveTrue(
                destination, TaxiGroup.GroupStatus.WAITING);

        if (group == null) {
            // Create new group with 4-digit ID
            String groupId;
            do {
                groupId = String.format("%04d", random.nextInt(10000));
            } while (taxiGroupRepository.findByGroupId(groupId).isPresent());

            group = new TaxiGroup(groupId, destination, userId);
            group = taxiGroupRepository.save(group);
        } else {
            group.addMember(userId);

            if (group.isFull()) {
                group.setStatus(TaxiGroup.GroupStatus.COMPLETE);
            }

            group = taxiGroupRepository.save(group);
        }

        // Notify all subscribers about the group update
        messagingTemplate.convertAndSend(
                "/topic/taxi-group/" + group.getGroupId(),
                new GroupUpdateMessage(group.getStatus(), group.getMemberCount()));

        return group;
    }

    @Transactional
    public TaxiGroup getGroupById(String groupId) {
        TaxiGroup group = taxiGroupRepository.findByGroupId(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group not found"));

        // Update member count if needed
        if (group.isExpired()) {
            group.setStatus(TaxiGroup.GroupStatus.EXPIRED);
            group.setActive(false);
            taxiGroupRepository.save(group);
        }

        return group;
    }

    @Transactional
    public void updateGroupCount(String destination) {
        int count = taxiGroupRepository.countByDestinationAndStatusAndIsActiveTrue(
                destination, TaxiGroup.GroupStatus.WAITING);
        messagingTemplate.convertAndSend("/topic/taxi-count/" + destination, count);
    }

    @Scheduled(fixedRate = 1000) // Check every second
    @Transactional
    public void checkWaitingGroups() {
        LocalDateTime now = LocalDateTime.now();
        List<TaxiGroup> waitingGroups = taxiGroupRepository.findByStatusAndIsActiveTrue(
                TaxiGroup.GroupStatus.WAITING);

        for (TaxiGroup group : waitingGroups) {
            if (now.isAfter(group.getCreatedAt().plusSeconds(15))) {
                if (group.getMemberCount() > 1) {
                    group.setStatus(TaxiGroup.GroupStatus.PARTIAL);
                } else {
                    group.setStatus(TaxiGroup.GroupStatus.FAILED);
                }
                taxiGroupRepository.save(group);

                messagingTemplate.convertAndSend(
                        "/topic/taxi-group/" + group.getGroupId(),
                        new GroupUpdateMessage(group.getStatus(), group.getMemberCount()));
            }
        }
    }

    @Scheduled(fixedRate = 60000) // Check every minute
    @Transactional
    public void checkExpiredGroups() {
        LocalDateTime now = LocalDateTime.now();
        List<TaxiGroup> activeGroups = taxiGroupRepository.findByIsActiveTrue();

        for (TaxiGroup group : activeGroups) {
            if (group.isExpired()) {
                group.setStatus(TaxiGroup.GroupStatus.EXPIRED);
                group.setActive(false);
                taxiGroupRepository.save(group);
            }
        }
    }

    @Scheduled(fixedRate = 3600000) // Check every hour
    @Transactional
    public void deleteOldGroups() {
        List<TaxiGroup> inactiveGroups = taxiGroupRepository.findByIsActiveFalse();

        for (TaxiGroup group : inactiveGroups) {
            if (group.shouldBeDeleted()) {
                taxiGroupRepository.delete(group);
            }
        }
    }

    @Transactional
    public int leaveAllGroups(String userId) {
        List<TaxiGroup> activeGroups = taxiGroupRepository.findByIsActiveTrueAndMembersContaining(userId);
        int count = 0;

        for (TaxiGroup group : activeGroups) {
            if (group.getStatus() == TaxiGroup.GroupStatus.WAITING) {
                // 대기 중인 그룹에서 나가기
                group.removeMember(userId);

                // 만약 멤버가 없으면 그룹 비활성화
                if (group.getMemberCount() == 0) {
                    group.setStatus(TaxiGroup.GroupStatus.FAILED);
                    group.setActive(false);
                }

                taxiGroupRepository.save(group);

                // 그룹 업데이트 알림
                messagingTemplate.convertAndSend(
                        "/topic/taxi-group/" + group.getGroupId(),
                        new GroupUpdateMessage(group.getStatus(), group.getMemberCount()));

                count++;
            } else if (group.getStatus() == TaxiGroup.GroupStatus.FAILED) {
                // 실패한 그룹은 비활성화
                group.setActive(false);
                taxiGroupRepository.save(group);
                count++;
            }
            // COMPLETE나 PARTIAL 상태의 그룹은 이미 채팅방이 열렸으므로 나가지 않음
        }

        return count;
    }

    private static class GroupUpdateMessage {
        private final TaxiGroup.GroupStatus status;
        private final int memberCount;

        public GroupUpdateMessage(TaxiGroup.GroupStatus status, int memberCount) {
            this.status = status;
            this.memberCount = memberCount;
        }

        public TaxiGroup.GroupStatus getStatus() {
            return status;
        }

        public int getMemberCount() {
            return memberCount;
        }
    }
}