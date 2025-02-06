package homerun2.backend.controller;

import homerun2.backend.service.ShuttleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/shuttle")
public class ShuttleController {

    private final ShuttleService shuttleService;

    @Autowired
    public ShuttleController(ShuttleService shuttleService) {
        this.shuttleService = shuttleService;
    }

    @GetMapping("/fromMJUtoGH")
    public ResponseEntity<?> getMtoGShuttle() {
        try {
            LocalDateTime currentTime = shuttleService.getKoreanTime();
            String today = shuttleService.getDay();

            // 주말이면 운행하지 않음
            if (today == null) {
                return ResponseEntity.ok(Map.of("message", "주말에는 셔틀버스가 운행하지 않습니다."));
            }

            Integer m = shuttleService.getMStationTimeMtoG(currentTime);
            Integer el = shuttleService.getEverlineTimeMtoG(m, currentTime);
            Integer g = shuttleService.getGStationTimeMtoG(today, currentTime);

            Map<String, Object> response = new HashMap<>();

            // 모든 셔틀이 운행 종료된 경우
            if (m == null && g == null && el == null) {
                return ResponseEntity.ok(Map.of("message", "오늘은 더 이상 셔틀이 없습니다."));
            }

            Map<String, Object> routes = new HashMap<>();

            // 기흥역 셔틀
            if (g != null) {
                Map<String, Object> giheungRoute = new HashMap<>();
                giheungRoute.put("name", "기흥역 셔틀");
                giheungRoute.put("time", g);
                routes.put("giheung", giheungRoute);
            }

            // 에버라인 + 명지대역 셔틀 경로
            if (m != null && el != null) {
                Map<String, Object> everlineRoute = new HashMap<>();
                everlineRoute.put("name", "에버라인 + 명지대역 셔틀");
                everlineRoute.put("time", el);
                everlineRoute.put("connection", m);
                routes.put("everline", everlineRoute);
            }

            response.put("routes", routes);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("message", "셔틀 정보를 조회할 수 없습니다."));
        }
    }

    @GetMapping("/fromGHtoMJU")
    public ResponseEntity<?> getGtoMShuttle() {
        try {
            LocalDateTime currentTime = shuttleService.getKoreanTime();
            String today = shuttleService.getDay();

            // 주말이면 운행하지 않음
            if (today == null) {
                return ResponseEntity.ok(Map.of("message", "주말에는 셔틀버스가 운행하지 않습니다."));
            }

            Integer el = shuttleService.getEverlineTimeGtoM(currentTime);
            Integer m = shuttleService.getMStationTimeGtoM(el, currentTime);
            Integer g = shuttleService.getGStationTimeGtoM(today, currentTime);

            Map<String, Object> response = new HashMap<>();

            // 모든 셔틀이 운행 종료된 경우
            if (m == null && g == null && el == null) {
                return ResponseEntity.ok(Map.of("message", "오늘은 더 이상 셔틀이 없습니다."));
            }

            Map<String, Object> routes = new HashMap<>();

            // 기흥역 셔틀
            if (g != null) {
                Map<String, Object> giheungRoute = new HashMap<>();
                giheungRoute.put("name", "기흥역 셔틀");
                giheungRoute.put("time", g);
                routes.put("giheung", giheungRoute);
            }

            // 에버라인 + 명지대역 셔틀 경로
            if (m != null && el != null) {
                Map<String, Object> everlineRoute = new HashMap<>();
                everlineRoute.put("name", "에버라인 + 명지대역 셔틀");
                everlineRoute.put("time", el);
                everlineRoute.put("connection", m);
                routes.put("everline", everlineRoute);
            }

            response.put("routes", routes);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("message", "셔틀 정보를 조회할 수 없습니다."));
        }
    }
}
