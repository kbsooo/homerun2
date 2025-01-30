package homerun2.backend.model;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class KakaoUserInfo {
    private Long id;
    private String nickname;
    private String profileImage;

    public static KakaoUserInfo of(Long id, String nickname, String profileImage) {
        return KakaoUserInfo.builder()
                .id(id)
                .nickname(nickname)
                .profileImage(profileImage)
                .build();
    }
}