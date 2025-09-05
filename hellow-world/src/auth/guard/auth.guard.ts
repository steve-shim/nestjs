import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Observable } from "rxjs";


@Injectable()
export class AuthGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
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