package homerun2.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.StringReader;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class BusService {
    private static final Logger logger = LoggerFactory.getLogger(BusService.class);
    private final Map<String, String> busRouteMap;
    private final String apiKey;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public BusService(
            @Value("${bus.routeMap}") String busRouteMapString,
            @Value("${bus.api-key}") String apiKey) {
        this.apiKey = apiKey;
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
        this.busRouteMap = parseBusRouteMap(busRouteMapString);
        logger.info("Initialized BusService with routeMap: {}", busRouteMap);
    }

    private Map<String, String> parseBusRouteMap(String busRouteMapString) {
        try {
            return objectMapper.readValue(busRouteMapString, new TypeReference<Map<String, String>>() {
            });
        } catch (Exception e) {
            logger.error("Failed to parse bus route map: {}", busRouteMapString, e);
            throw new RuntimeException("Failed to parse bus route map", e);
        }
    }

    public List<Map<String, String>> getBusArrivalInfo(String stationId, List<String> busNumbers) {
        try {
            // URL을 직접 구성
            String baseUrl = "http://apis.data.go.kr/6410000/busarrivalservice/getBusArrivalList";
            String url = String.format("%s?serviceKey=%s&stationId=%s",
                    baseUrl,
                    URLEncoder.encode(apiKey, StandardCharsets.UTF_8),
                    stationId);

            logger.info("Requesting bus arrival info from URL: {}", url);
            logger.info("Station ID: {}, Bus Numbers: {}", stationId, busNumbers);

            String xmlResponse = restTemplate.getForObject(new URI(url), String.class);
            logger.info("Received XML response: {}", xmlResponse);

            DocumentBuilder builder = DocumentBuilderFactory.newInstance().newDocumentBuilder();
            Document doc = builder.parse(new InputSource(new StringReader(xmlResponse)));

            // Check for error response
            NodeList errorHeader = doc.getElementsByTagName("cmmMsgHeader");
            if (errorHeader.getLength() > 0) {
                Element header = (Element) errorHeader.item(0);
                String errorMsg = getTextContent(header, "errMsg");
                String authMsg = getTextContent(header, "returnAuthMsg");
                String reasonCode = getTextContent(header, "returnReasonCode");

                logger.error("API Error - Message: {}, Auth: {}, Code: {}", errorMsg, authMsg, reasonCode);
                Map<String, String> errorMap = new HashMap<>();
                errorMap.put("message", "API Error: " + errorMsg);
                errorMap.put("details", authMsg);
                return List.of(errorMap);
            }

            // Check regular response status
            NodeList headerList = doc.getElementsByTagName("msgHeader");
            if (headerList.getLength() > 0) {
                Element header = (Element) headerList.item(0);
                String resultCode = getTextContent(header, "resultCode");
                String resultMessage = getTextContent(header, "resultMsg");
                logger.info("API Response - Code: {}, Message: {}", resultCode, resultMessage);

                if (!"0".equals(resultCode)) {
                    throw new RuntimeException("API Error: " + resultMessage);
                }
            }

            NodeList busArrivalList = doc.getElementsByTagName("busArrivalList");
            List<Map<String, String>> filteredBusInfo = new ArrayList<>();

            logger.info("Found {} bus arrival entries", busArrivalList.getLength());

            for (int i = 0; i < busArrivalList.getLength(); i++) {
                Element item = (Element) busArrivalList.item(i);
                String routeId = getTextContent(item, "routeId");
                logger.debug("Processing routeId: {}", routeId);

                if (busRouteMap.containsValue(routeId)) {
                    Map<String, String> busInfo = new HashMap<>();
                    String busNumber = getBusNumberByRouteId(routeId);
                    String predictTime = getTextContent(item, "predictTime1");
                    String remainSeatCnt = getTextContent(item, "remainSeatCnt1");

                    busInfo.put("버스번호", busNumber);
                    busInfo.put("도착시간", predictTime);
                    busInfo.put("남은좌석수", remainSeatCnt.equals("-1") ? "정보 없음" : remainSeatCnt + "석 남음");

                    filteredBusInfo.add(busInfo);
                    logger.debug("Added bus info: {}", busInfo);
                }
            }
            return filteredBusInfo;
        } catch (Exception e) {
            logger.error("Error retrieving bus information", e);
            Map<String, String> errorMap = new HashMap<>();
            errorMap.put("message", "Error retrieving bus information");
            errorMap.put("error", e.getMessage());
            return List.of(errorMap);
        }
    }

    private String getTextContent(Element element, String tagName) {
        NodeList nodeList = element.getElementsByTagName(tagName);
        if (nodeList.getLength() > 0) {
            return nodeList.item(0).getTextContent();
        }
        return "";
    }

    private String getBusNumberByRouteId(String routeId) {
        return busRouteMap.entrySet()
                .stream()
                .filter(entry -> entry.getValue().equals(routeId))
                .map(Map.Entry::getKey)
                .findFirst()
                .orElse("");
    }
}
