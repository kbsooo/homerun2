package homerun2.backend.controller;

import homerun2.backend.model.KakaoUserInfo;
import homerun2.backend.service.KakaoAuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth/kakao")
@RequiredArgsConstructor
public class KakaoAuthController {

    private final KakaoAuthService kakaoAuthService;

    @GetMapping("/callback")
    public ResponseEntity<KakaoUserInfo> kakaoCallback(@RequestParam String code) {
        String accessToken = kakaoAuthService.getKakaoAccessToken(code);
        KakaoUserInfo userInfo = kakaoAuthService.getKakaoUserInfo(accessToken);
        return ResponseEntity.ok(userInfo);
    }
}