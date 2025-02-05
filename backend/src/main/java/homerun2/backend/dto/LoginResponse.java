package homerun2.backend.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class LoginResponse {
    private String token;
    private String nickname;
    private String profileImage;

    public static LoginResponse of(String token, String nickname, String profileImage) {
        return LoginResponse.builder()
                .token(token)
                .nickname(nickname)
                .profileImage(profileImage)
                .build();
    }
}