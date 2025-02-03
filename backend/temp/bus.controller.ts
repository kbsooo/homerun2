import { Controller, Get, Query } from '@nestjs/common'; // @nestjs/common에서 가져와야 합니다
import { BusService } from './bus.service';
import { ConfigService } from '@nestjs/config';

// HTTP 요청을 받아서 BusService에 있는 비즈니스 로직을 실행합니다
//mju-to-giheung 경로로 들어오는 get 요청을 처리하여 명지대에서 기흥역까지 가는 버스 정보를 반환
//giheung-to-mju 경로로 들어오는 get 요청을 처리하여 기흥역에서 명지대까지 가는 버스 정보를 반환
@Controller('bus')
export class BusController {
  //실제 도착 정보는 BusService 클래스에 정의된 getBusArrivalInfo 메서드를 통해 처리됨.
  constructor(
    private readonly busService: BusService,
    private readonly configService: ConfigService,
  ) {}

  @Get('mju-to-giheung')
  async getMjuToGiheungBusInfo(@Query('apiKey') apiKey: string) {
    const stationId = this.configService.get<string>(
      'MJU_TO_GIHEUNG_STATION_ID',
    );
    const busNumbers = this.configService.get<string>('BUS_NUMBERS').split(',');

    return this.busService.getBusArrivalInfo(stationId, busNumbers);
  }

  @Get('giheung-to-mju')
  async getGiheungToMjuBusInfo(@Query('apiKey') apiKey: string) {
    const stationId = this.configService.get<string>(
      'GIHEUNG_TO_MJU_STATION_ID',
    );
    const busNumbers = this.configService.get<string>('BUS_NUMBERS').split(',');

    return this.busService.getBusArrivalInfo(stationId, busNumbers);
  }
}