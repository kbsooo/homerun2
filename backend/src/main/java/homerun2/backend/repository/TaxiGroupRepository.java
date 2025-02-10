package homerun2.backend.repository;

import homerun2.backend.model.TaxiGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface TaxiGroupRepository extends JpaRepository<TaxiGroup, Long> {
    Optional<TaxiGroup> findByGroupId(String groupId);

    List<TaxiGroup> findByDestinationAndActiveTrue(String destination);

    Optional<TaxiGroup> findByDestinationAndActiveTrueAndCurrentMembersLessThan(String destination, int maxMembers);
}