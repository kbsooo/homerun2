package com.example.taxi.service;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;

@Transactional
public class TaxiGroupService {

    private final TaxiGroupRepository taxiGroupRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public TaxiGroupService(TaxiGroupRepository taxiGroupRepository, SimpMessagingTemplate messagingTemplate) {
        this.taxiGroupRepository = taxiGroupRepository;
        this.messagingTemplate = messagingTemplate;
    }

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
}