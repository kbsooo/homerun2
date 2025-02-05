import { Controller, Get } from '@nestjs/common';
import { ShuttleService } from './shuttle.service';
//주어진 경로에 대해 다음 셔틀 버스의 정보를 제공하는 기능 수행
@Controller('shuttle')
export class ShuttleController {
  constructor(private readonly shuttleService: ShuttleService) {}

  @Get('mju-to-giheung')
  getMtoGShuttle() {
    const currentTime = this.shuttleService.getKoreanTime();
    const today = this.shuttleService.getDay();
    const m = this.shuttleService.getMStationTimeMtoG(currentTime);
    const el = this.shuttleService.getEverlineTimeMtoG(m, currentTime);
    const g = this.shuttleService.getGStationTimeMtoG(today, currentTime);

    const eta_el = el + 16;
    const eta_g = g + 15;

    if (m !== null && g !== null && el !== null) {
      if (eta_g <= eta_el) {
        return { nextShuttle: '기흥역 셔틀버스', time: g };
      } else {
        return { nextShuttle: '명지대역 셔틀버스', time: m };
      }
    } else {
      return { message: '오늘은 더 이상 셔틀이 없습니다.' };
    }
  }

  @Get('giheung-to-mju')
  getGtoMShuttle() {
    const currentTime = this.shuttleService.getKoreanTime();
    const today = this.shuttleService.getDay();
    const el = this.shuttleService.getEverlineTimeGtoM(currentTime);
    const m = this.shuttleService.getMStationTimeGtoM(el, currentTime);
    const g = this.shuttleService.getGStationTimeGtoM(today, currentTime);

    const eta_m = m + 10;
    const eta_g = g + 15;

    if (m !== null && g !== null && el !== null) {
      if (eta_g <= eta_m) {
        return { nextShuttle: '기흥역 셔틀버스', time: g };
      } else {
        return { nextShuttle: '명지대역 셔틀버스', time: m };
      }
    } else {
      return { message: '오늘은 더 이상 셔틀이 없습니다.' };
    }
  }
}