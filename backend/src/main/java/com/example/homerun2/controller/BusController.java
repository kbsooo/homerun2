package com.example.homerun2.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.StringReader;
import org.xml.sax.InputSource;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/bus")
@CrossOrigin(origins = "http://localhost:3000")
public class BusController {
    private final RestTemplate restTemplate;
    private final String busApiKey;

    public BusController(RestTemplate restTemplate, String busApiKey) {
        this.restTemplate = restTemplate;
        this.busApiKey = busApiKey;
    }

    @GetMapping("/fromMJUtoGH")
    @CrossOrigin(origins = "http://localhost:3000")
    public ResponseEntity<?> getBusFromMJUtoGH() {
        try {
            String url = "http://apis.data.go.kr/6410000/busarrivalservice/getBusArrivalList";
            String stationId = "228001990";

            UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(url)
                    .queryParam("serviceKey", busApiKey)
                    .queryParam("stationId", stationId);

            ResponseEntity<String> response = restTemplate.getForEntity(builder.toUriString(), String.class);

            if (response.getStatusCode() == HttpStatus.OK) {
                String xmlResponse = response.getBody();
                List<Map<String, String>> busInfo = parseXmlResponse(xmlResponse);
                return ResponseEntity.ok(busInfo);
            } else {
                return ResponseEntity.status(response.getStatusCode()).body("버스 정보를 가져오는데 실패했습니다.");
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("서버 오류가 발생했습니다: " + e.getMessage());
        }
    }

    @GetMapping("/fromGHtoMJU")
    @CrossOrigin(origins = "http://localhost:3000")
    public ResponseEntity<?> getBusFromGHtoMJU() {
        try {
            String url = "http://apis.data.go.kr/6410000/busarrivalservice/getBusArrivalList";
            String stationId = "228000713";

            UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(url)
                    .queryParam("serviceKey", busApiKey)
                    .queryParam("stationId", stationId);

            ResponseEntity<String> response = restTemplate.getForEntity(builder.toUriString(), String.class);

            if (response.getStatusCode() == HttpStatus.OK) {
                String xmlResponse = response.getBody();
                List<Map<String, String>> busInfo = parseXmlResponse(xmlResponse);
                return ResponseEntity.ok(busInfo);
            } else {
                return ResponseEntity.status(response.getStatusCode()).body("버스 정보를 가져오는데 실패했습니다.");
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("서버 오류가 발생했습니다: " + e.getMessage());
        }
    }

    @GetMapping("/next/{direction}/{time}")
    @CrossOrigin(origins = "http://localhost:3000")
    public ResponseEntity<?> getNextBusArrival(
            @PathVariable String direction,
            @PathVariable String time) {
        try {
            String url = "http://apis.data.go.kr/6410000/busarrivalservice/getBusArrivalList";
            String stationId = direction.equals("fromMJUtoGH") ? "228001990" : "228000713";

            UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(url)
                    .queryParam("serviceKey", busApiKey)
                    .queryParam("stationId", stationId);

            ResponseEntity<String> response = restTemplate.getForEntity(builder.toUriString(), String.class);

            if (response.getStatusCode() == HttpStatus.OK) {
                String xmlResponse = response.getBody();
                List<Map<String, String>> busInfo = parseXmlResponse(xmlResponse);

                // 각 버스의 다음 도착 시간 정보만 필터링
                List<Map<String, String>> nextBusInfo = busInfo.stream()
                        .filter(bus -> bus.containsKey("도착시간2") && !bus.get("도착시간2").isEmpty())
                        .map(bus -> {
                            Map<String, String> nextInfo = new HashMap<>();
                            nextInfo.put("버스번호", bus.get("버스번호"));
                            nextInfo.put("도착시간", bus.get("도착시간2"));
                            nextInfo.put("남은좌석수", bus.get("남은좌석수2"));
                            return nextInfo;
                        })
                        .collect(Collectors.toList());

                System.out.println("Next bus info endpoint returned " + nextBusInfo.size() + " results");
                return ResponseEntity.ok(nextBusInfo);
            } else {
                return ResponseEntity.status(response.getStatusCode()).body("버스 정보를 가져오는데 실패했습니다.");
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("서버 오류가 발생했습니다: " + e.getMessage());
        }
    }

    private List<Map<String, String>> parseXmlResponse(String xmlString) throws Exception {
        // 최소한의 정보만 로깅
        System.out.println("XML Response received, length: " + xmlString.length());

        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        DocumentBuilder builder = factory.newDocumentBuilder();
        Document doc = builder.parse(new InputSource(new StringReader(xmlString)));

        NodeList itemList = doc.getElementsByTagName("busArrivalList");
        System.out.println("Found " + itemList.getLength() + " bus arrival items");

        List<Map<String, String>> busInfoList = new ArrayList<>();
        Set<String> targetBusNumbers = new HashSet<>(Arrays.asList("5005", "5600", "5003A", "5003B", "820"));

        for (int i = 0; i < itemList.getLength(); i++) {
            Element item = (Element) itemList.item(i);
            String routeId = getElementText(item, "routeId");
            String busNumber = getBusNumberFromRouteId(routeId);

            if (targetBusNumbers.contains(busNumber)) {
                Map<String, String> busInfo = new HashMap<>();
                busInfo.put("버스번호", busNumber);

                // 첫 번째 버스 정보
                String predictTime1 = getElementText(item, "predictTime1");
                String remainSeat1 = getElementText(item, "remainSeatCnt1");

                if (!predictTime1.isEmpty() && !predictTime1.equals("0")) {
                    busInfo.put("도착시간", predictTime1);
                    busInfo.put("남은좌석수", remainSeat1.equals("-1") ? "정보 없음" : remainSeat1 + "석 남음");

                    // 두 번째 버스 정보
                    String predictTime2 = getElementText(item, "predictTime2");
                    String remainSeat2 = getElementText(item, "remainSeatCnt2");

                    // predictTime2가 존재하면 조건 완화하여 추가
                    if (!predictTime2.isEmpty()) {
                        try {
                            int time1 = Integer.parseInt(predictTime1);
                            int time2 = Integer.parseInt(predictTime2);

                            // 두 번째 버스 시간이 유효한 경우 추가 (꼭 첫 번째보다 클 필요는 없음)
                            if (time2 > 0) {
                                busInfo.put("도착시간2", predictTime2);
                                busInfo.put("남은좌석수2", remainSeat2.equals("-1") ? "정보 없음" : remainSeat2 + "석 남음");
                            }
                        } catch (NumberFormatException e) {
                            // 숫자 변환 실패해도 문자열이 존재하면 추가 (API 응답 형식 변경 가능성 고려)
                            if (!predictTime2.trim().equals("")) {
                                busInfo.put("도착시간2", predictTime2);
                                busInfo.put("남은좌석수2", remainSeat2.equals("-1") ? "정보 없음" : remainSeat2 + "석 남음");
                            }
                        }
                    }
                } else {
                    busInfo.put("도착시간", "정보 없음");
                    busInfo.put("남은좌석수", "정보 없음");
                }

                busInfoList.add(busInfo);
            }
        }

        System.out.println("Processed " + busInfoList.size() + " buses matching target numbers");
        return busInfoList;
    }

    private String getElementText(Element element, String tagName) {
        NodeList nodeList = element.getElementsByTagName(tagName);
        if (nodeList.getLength() > 0) {
            return nodeList.item(0).getTextContent();
        }
        return "";
    }

    private String getBusNumberFromRouteId(String routeId) {
        // 실제 구현에서는 routeId를 버스 번호로 매핑하는 로직이 필요합니다
        // 임시로 하드코딩된 매핑을 반환
        Map<String, String> routeMap = new HashMap<>();
        routeMap.put("228000064", "5005");
        routeMap.put("228000063", "5600");
        routeMap.put("228000065", "5003A");
        routeMap.put("228000066", "5003B");
        routeMap.put("228000067", "820");
        return routeMap.getOrDefault(routeId, "알 수 없음");
    }
}