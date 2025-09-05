import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";
import { Public } from "../decorator/public.decorator";


@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
    ){}

    canActivate(context: ExecutionContext): boolean {
        // 만약에 public decoration이 되있으면
        // 모든 로직을 bypass
        // 커스텀 데코레이터와 가드를 조합하면 다양한 케이스 생성 가능
        const isPublic = this.reflector.get(Public, context.getHandler())

        if(isPublic) {
            return true;
        }

        // 요청에서 user 객체가 존재하는지 확인한다.
        const request = context.switchToHttp().getRequest();

        // 프라이빗 리소스에 접근하는건 access 토큰 기반이어야한다
        // access 토큰을 재발급 받는것만 refresh 토큰의 역할
        if(!request.user || request.user.type !== 'access') {
            return false;
        }

        return true;
    }
}