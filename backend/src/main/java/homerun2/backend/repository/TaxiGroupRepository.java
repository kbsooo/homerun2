package homerun2.backend.repository;

import homerun2.backend.model.TaxiGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface TaxiGroupRepository extends JpaRepository<TaxiGroup, Long> {
    Optional<TaxiGroup> findByGroupId(String groupId);

    @Query("SELECT g FROM TaxiGroup g WHERE g.isActive = true AND :userId MEMBER OF g.members")
    List<TaxiGroup> findByIsActiveTrueAndMembersContaining(@Param("userId") String userId);

    @Query("SELECT g FROM TaxiGroup g WHERE g.destination = :destination AND g.status = :status AND g.isActive = true ORDER BY g.createdAt ASC")
    TaxiGroup findFirstByDestinationAndStatusAndIsActiveTrue(
            @Param("destination") String destination,
            @Param("status") TaxiGroup.GroupStatus status);

    @Query("SELECT COUNT(g) FROM TaxiGroup g WHERE g.destination = :destination AND g.status = :status AND g.isActive = true")
    int countByDestinationAndStatusAndIsActiveTrue(
            @Param("destination") String destination,
            @Param("status") TaxiGroup.GroupStatus status);

    @Query("SELECT g FROM TaxiGroup g WHERE g.status = :status AND g.isActive = true")
    List<TaxiGroup> findByStatusAndIsActiveTrue(@Param("status") TaxiGroup.GroupStatus status);

    List<TaxiGroup> findByIsActiveTrue();

    List<TaxiGroup> findByIsActiveFalse();
}