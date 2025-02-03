package homerun2.backend.controller;

import homerun2.backend.service.BusService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/bus")
public class BusController {
    private final BusService busService;
    private final String fromMJUtoGHStationId;
    private final String fromGHtoMJUStationId;
    private final List<String> busNumbers;

    public BusController(
            BusService busService,
            @Value("${bus.station.fromMJUtoGH}") String fromMJUtoGHStationId,
            @Value("${bus.station.fromGHtoMJU}") String fromGHtoMJUStationId,
            @Value("#{'${bus.numbers}'.split(',')}") List<String> busNumbers) {
        this.busService = busService;
        this.fromMJUtoGHStationId = fromMJUtoGHStationId;
        this.fromGHtoMJUStationId = fromGHtoMJUStationId;
        this.busNumbers = busNumbers;
    }

    @GetMapping("/fromMJUtoGH")
    public List<Map<String, String>> getMjuToGiheungBusInfo() {
        return busService.getBusArrivalInfo(fromMJUtoGHStationId, busNumbers);
    }

    @GetMapping("/fromGHtoMJU")
    public List<Map<String, String>> getGiheungToMjuBusInfo() {
        return busService.getBusArrivalInfo(fromGHtoMJUStationId, busNumbers);
    }
}
