import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as xml2js from 'xml2js';
//주어진 정류장ID와 버스 번호를 사용하여 API에 요청하고, 응답받은 XML 데이터를 처리하여 필요한 정보 반환
//버스 번호에 따른 도착 정보 필터링과 포맷팅을 수행하며, 필요한 경우 오류 처리도 포함
@Injectable()
export class BusService {
  private readonly busRouteMap: { [key: string]: string };

  constructor(private readonly configService: ConfigService) {
    // 환경 변수에서 busRouteMap을 불러와 객체로 변환
    const busRouteMapString = this.configService.get<string>('BUS_ROUTE_MAP');
    this.busRouteMap = JSON.parse(busRouteMapString);
  }

  //주어진 정류장ID와 버스 번호 배열을 사용하여 해당 정류장에서 도착할 버스 정보를 가져오는 메서드
  async getBusArrivalInfo(stationId: string, busNumbers: string[]) {
    const apiKey = this.configService.get<string>('API_KEY'); //환경변수에서 API_KEY 불러오기
    const url = `http://apis.data.go.kr/6410000/busarrivalservice/getBusArrivalList?serviceKey=${apiKey}&stationId=${stationId}`;
    const parser = new xml2js.Parser();

    try {
      const response = await axios.get(url);
      const xmlData = response.data;
      const jsonData = await parser.parseStringPromise(xmlData);

      if (jsonData.response && jsonData.response.msgBody[0].busArrivalList) {
        const items = jsonData.response.msgBody[0].busArrivalList;
        const filteredBusInfo = items
          .filter((item) =>
            Object.values(this.busRouteMap).includes(item.routeId[0]),
          )
          .map((item) => ({
            버스번호: Object.keys(this.busRouteMap).find(
              (key) => this.busRouteMap[key] === item.routeId[0],
            ),
            도착시간: `${item.predictTime1[0]}`,
            남은좌석수:
              item.remainSeatCnt1[0] === '-1'
                ? '정보 없음'
                : `${item.remainSeatCnt1[0]}석 남음`,
          }));
        return filteredBusInfo;
      } else {
        return []; // 데이터가 없을 경우 빈 배열 반환
      }
    } catch (error) {
      return { message: 'Error retrieving bus information', error };
    }
  }
}