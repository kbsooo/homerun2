package homerun2.backend.service;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

@Service
public class ShuttleService {
    private static final String TIMETABLE_PATH = "timetable/";

    public LocalDateTime getKoreanTime() {
        return LocalDateTime.now(ZoneId.of("Asia/Seoul"));
    }

    public String getDay() {
        LocalDateTime now = getKoreanTime();
        int dayOfWeek = now.getDayOfWeek().getValue();
        switch (dayOfWeek) {
            case 1:
                return "MON";
            case 2:
                return "TUE";
            case 3:
                return "WED";
            case 4:
                return "THU";
            case 5:
                return "FRI";
            default:
                return null;
        }
    }

    private List<List<String>> readCsvFile(String filename) {
        List<List<String>> records = new ArrayList<>();
        try {
            ClassPathResource resource = new ClassPathResource(TIMETABLE_PATH + filename);
            try (BufferedReader br = new BufferedReader(new InputStreamReader(resource.getInputStream()))) {
                String line;
                while ((line = br.readLine()) != null) {
                    String[] values = line.split(",");
                    List<String> record = new ArrayList<>();
                    for (String value : values) {
                        record.add(value.trim());
                    }
                    records.add(record);
                }
            }
        } catch (IOException e) {
            // 파일을 찾지 못하거나 읽을 수 없는 경우 빈 리스트 반환
            return new ArrayList<>();
        }
        return records;
    }

    private int getCurrentMinutes(LocalDateTime time) {
        return time.getHour() * 60 + time.getMinute();
    }

    public Integer getGStationTimeGtoM(String day, LocalDateTime currentTime) {
        try {
            List<List<String>> csvData = readCsvFile("gStation.csv");
            int currentMinutes = getCurrentMinutes(currentTime);

            int dateNum;
            switch (day) {
                case "MON":
                    dateNum = 0;
                    break;
                case "TUE":
                    dateNum = 1;
                    break;
                case "WED":
                    dateNum = 2;
                    break;
                case "THU":
                    dateNum = 3;
                    break;
                case "FRI":
                    dateNum = 4;
                    break;
                default:
                    return null;
            }

            List<Integer> GStoMJU = new ArrayList<>();
            for (int i = 1; i < csvData.size(); i++) {
                String timeString = csvData.get(i).get(2 + dateNum * 4);
                String[] timeParts = timeString.split(":");
                int minutes = Integer.parseInt(timeParts[0]) * 60 + Integer.parseInt(timeParts[1]);
                GStoMJU.add(minutes);
            }

            for (Integer busTime : GStoMJU) {
                if (busTime >= currentMinutes) {
                    return busTime - currentMinutes;
                }
            }
            return null;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public Integer getMStationTimeGtoM(Integer el, LocalDateTime currentTime) {
        try {
            List<List<String>> csvData = readCsvFile("mStation.csv");
            if (el == null)
                return null;

            el += 16;
            int currentMinutes = getCurrentMinutes(currentTime);

            List<Integer> MStoMJU = new ArrayList<>();
            for (int i = 1; i < csvData.size(); i++) {
                MStoMJU.add(Integer.parseInt(csvData.get(i).get(3)));
            }

            for (Integer busTime : MStoMJU) {
                if (busTime >= el + currentMinutes) {
                    return busTime - currentMinutes;
                }
            }
            return null;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public Integer getEverlineTimeGtoM(LocalDateTime currentTime) {
        try {
            List<List<String>> csvData = readCsvFile("everline.csv");
            int currentMinutes = getCurrentMinutes(currentTime);

            List<Integer> GStoMS = new ArrayList<>();
            for (int i = 1; i < csvData.size(); i++) {
                GStoMS.add(Integer.parseInt(csvData.get(i).get(0)));
            }

            for (Integer subwayTime : GStoMS) {
                if (subwayTime >= currentMinutes) {
                    return subwayTime - currentMinutes;
                }
            }
            return null;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public Integer getGStationTimeMtoG(String day, LocalDateTime currentTime) {
        try {
            List<List<String>> csvData = readCsvFile("gStation.csv");
            int currentMinutes = getCurrentMinutes(currentTime);

            int dateNum;
            switch (day) {
                case "MON":
                    dateNum = 0;
                    break;
                case "TUE":
                    dateNum = 1;
                    break;
                case "WED":
                    dateNum = 2;
                    break;
                case "THU":
                    dateNum = 3;
                    break;
                case "FRI":
                    dateNum = 4;
                    break;
                default:
                    return null;
            }

            List<Integer> MJUtoGS = new ArrayList<>();
            for (int i = 1; i < csvData.size(); i++) {
                String timeString = csvData.get(i).get(1 + dateNum * 4);
                String[] timeParts = timeString.split(":");
                int minutes = Integer.parseInt(timeParts[0]) * 60 + Integer.parseInt(timeParts[1]);
                MJUtoGS.add(minutes);
            }

            for (Integer busTime : MJUtoGS) {
                if (busTime >= currentMinutes) {
                    return busTime - currentMinutes;
                }
            }
            return null;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public Integer getMStationTimeMtoG(LocalDateTime currentTime) {
        try {
            List<List<String>> csvData = readCsvFile("mStation.csv");
            int currentMinutes = getCurrentMinutes(currentTime);

            List<Integer> MJUtoMS = new ArrayList<>();
            for (int i = 1; i < csvData.size(); i++) {
                MJUtoMS.add(Integer.parseInt(csvData.get(i).get(2)));
            }

            for (Integer busTime : MJUtoMS) {
                if (busTime >= currentMinutes) {
                    return busTime - currentMinutes;
                }
            }
            return null;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public Integer getEverlineTimeMtoG(Integer m, LocalDateTime currentTime) {
        try {
            if (m == null)
                return null;

            List<List<String>> csvData = readCsvFile("everline.csv");
            m += 10;
            int currentMinutes = getCurrentMinutes(currentTime);

            List<Integer> MStoGS = new ArrayList<>();
            for (int i = 1; i < csvData.size(); i++) {
                MStoGS.add(Integer.parseInt(csvData.get(i).get(2)));
            }

            for (Integer subwayTime : MStoGS) {
                if (subwayTime >= m + currentMinutes) {
                    return subwayTime - currentMinutes;
                }
            }
            return null;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
}
