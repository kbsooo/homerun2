package homerun2.backend.service;

import homerun2.backend.model.TaxiGroup;
import homerun2.backend.repository.TaxiGroupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class TaxiGroupService {
    private final TaxiGroupRepository taxiGroupRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private static final int MAX_MEMBERS = 4;

    @Transactional
    public TaxiGroup joinOrCreateGroup(String userId, String destination) {
        // Try to find an existing active group with space
        TaxiGroup group = taxiGroupRepository
                .findByDestinationAndActiveTrueAndCurrentMembersLessThan(destination, MAX_MEMBERS)
                .orElseGet(() -> createNewGroup(destination));

        if (!group.getMemberIds().contains(userId)) {
            group.getMemberIds().add(userId);
            group.setCurrentMembers(group.getCurrentMembers() + 1);
            group = taxiGroupRepository.save(group);

            // Notify all clients about the updated group count
            updateGroupCount(destination);
        }

        return group;
    }

    private TaxiGroup createNewGroup(String destination) {
        TaxiGroup newGroup = new TaxiGroup();
        newGroup.setGroupId(generateGroupId());
        newGroup.setDestination(destination);
        newGroup.setCurrentMembers(0);
        return taxiGroupRepository.save(newGroup);
    }

    private String generateGroupId() {
        Random random = new Random();
        String groupId;
        do {
            groupId = String.format("%04d", random.nextInt(10000));
        } while (taxiGroupRepository.findByGroupId(groupId).isPresent());
        return groupId;
    }

    public void updateGroupCount(String destination) {
        List<TaxiGroup> activeGroups = taxiGroupRepository.findByDestinationAndActiveTrue(destination);
        int totalMembers = activeGroups.stream()
                .mapToInt(TaxiGroup::getCurrentMembers)
                .sum();

        messagingTemplate.convertAndSend(
                "/topic/taxi-count/" + destination,
                totalMembers);
    }

    public TaxiGroup getGroupById(String groupId) {
        return taxiGroupRepository.findByGroupId(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));
    }
}