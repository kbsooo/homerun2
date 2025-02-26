package homerun2.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import homerun2.backend.dto.LoginResponse;
import homerun2.backend.model.KakaoUserInfo;
import homerun2.backend.service.JwtService;
import homerun2.backend.service.KakaoAuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
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

    @Value("${frontend.url:http://localhost:3000}")
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

        // HTML 응답을 반환하여 프론트엔드로 데이터 전달
        return String.format("""
                <html>
                <body>
                    <script>
                        const loginData = decodeURIComponent('%s');
                        const data = JSON.parse(loginData);
                        window.opener.postMessage(data, '%s');
                        window.close();
                    </script>
                </body>
                </html>
                """, jsonResponse, frontendUrl);
    }
}