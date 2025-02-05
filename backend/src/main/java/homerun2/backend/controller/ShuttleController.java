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

            int eta_el = el != null ? el + 16 : Integer.MAX_VALUE;
            int eta_g = g != null ? g + 15 : Integer.MAX_VALUE;

            if (eta_g <= eta_el) {
                response.put("nextShuttle", "기흥역 셔틀버스");
                response.put("time", g);
            } else {
                response.put("nextShuttle", "명지대역 셔틀버스");
                response.put("time", m);
            }

            // 추가 정보 제공
            response.put("giheungTime", g);
            response.put("mjuStationTime", m);
            response.put("everlineTime", el);

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

            int eta_m = m != null ? m + 10 : Integer.MAX_VALUE;
            int eta_g = g != null ? g + 15 : Integer.MAX_VALUE;

            if (eta_g <= eta_m) {
                response.put("nextShuttle", "기흥역 셔틀버스");
                response.put("time", g);
            } else {
                response.put("nextShuttle", "명지대역 셔틀버스");
                response.put("time", m);
            }

            // 추가 정보 제공
            response.put("giheungTime", g);
            response.put("mjuStationTime", m);
            response.put("everlineTime", el);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("message", "셔틀 정보를 조회할 수 없습니다."));
        }
    }
}
