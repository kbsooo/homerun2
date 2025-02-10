package homerun2.backend.repository;

import homerun2.backend.model.TaxiChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TaxiChatMessageRepository extends JpaRepository<TaxiChatMessage, Long> {
    List<TaxiChatMessage> findByGroupIdOrderByTimestampAsc(String groupId);
}