package homerun2.backend.model;

import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class TaxiGroup {
    // 기존 필드 및 메소드는 여기에 있습니다

    // 멤버 제거 메소드 추가
    public void removeMember(String userId) {
        this.members.remove(userId);
    }
}