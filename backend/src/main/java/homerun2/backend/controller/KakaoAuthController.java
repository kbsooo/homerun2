package homerun2.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import homerun2.backend.dto.LoginResponse;
import homerun2.backend.model.KakaoUserInfo;
import homerun2.backend.service.JwtService;
import homerun2.backend.service.KakaoAuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/auth/kakao")
@RequiredArgsConstructor
public class KakaoAuthController {

    private final KakaoAuthService kakaoAuthService;
    private final JwtService jwtService;
    private final ObjectMapper objectMapper;
    // 배포
    @Value("${frontend.url:https://homerun2.vercel.app}")
    // 로컬
    // @Value("${frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @GetMapping(value = "/callback", produces = MediaType.TEXT_HTML_VALUE)
    @ResponseBody
    public String kakaoCallback(@RequestParam String code) throws Exception {
        String accessToken = kakaoAuthService.getKakaoAccessToken(code);
        KakaoUserInfo userInfo = kakaoAuthService.getKakaoUserInfo(accessToken);

        String token = jwtService.generateToken(userInfo.getId(), userInfo.getNickname());

        LoginResponse response = LoginResponse.of(
                token,
                userInfo.getNickname(),
                userInfo.getProfileImage());

        // LoginResponse를 JSON 문자열로 변환하고 URL 인코딩
        String jsonResponse = URLEncoder.encode(objectMapper.writeValueAsString(response),
                StandardCharsets.UTF_8.toString());

        // 로그 추가
        System.out.println("카카오 로그인 성공: 사용자 " + userInfo.getNickname() + ", 토큰 생성됨");
        System.out.println("프론트엔드로 리다이렉트 준비: " + frontendUrl);

        // HTML 응답을 반환하여 프론트엔드로 리다이렉트
        return String.format("""
                <html>
                <body>
                    <script>
                        const loginData = decodeURIComponent('%s');
                        const data = JSON.parse(loginData);
                        console.log('로그인 데이터:', data);

                        // 팝업 방식에서 리다이렉트 방식으로 변경
                        // 프론트엔드로 리다이렉트하면서 로그인 데이터 전달
                        window.location.href = '%s/?loginData=%s';
                    </script>
                </body>
                </html>
                """, jsonResponse, frontendUrl, jsonResponse);
    }

    /**
     * 프론트엔드의 Next.js API Route에서 호출하는 엔드포인트
     * 카카오 인증 코드를 받아 처리하고 로그인 응답을 반환합니다.
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody KakaoLoginRequest request) throws Exception {
        String accessToken = kakaoAuthService.getKakaoAccessToken(request.getCode());
        KakaoUserInfo userInfo = kakaoAuthService.getKakaoUserInfo(accessToken);

        String token = jwtService.generateToken(userInfo.getId(), userInfo.getNickname());

        LoginResponse response = LoginResponse.of(
                token,
                userInfo.getNickname(),
                userInfo.getProfileImage());

        return ResponseEntity.ok(response);
    }
}

/**
 * 카카오 로그인 요청을 위한 DTO
 */
class KakaoLoginRequest {
    private String code;

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }
}