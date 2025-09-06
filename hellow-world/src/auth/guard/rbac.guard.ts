import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";
import { Role } from "src/user/entities/user.entity";
import { RBAC } from "../decorator/rabc.decorator";

@Injectable()
export class RBACGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
    ){}
    
    canActivate(context: ExecutionContext): boolean {
        const role = this.reflector.get<Role>(RBAC, context.getHandler());

        /// Role Enum에 해당되는 값이 데코레이터에 들어갔는지 확인
        /// 값이 안들어있으면 RBACGuard를 bypass 시킴
        if(!Object.values(Role).includes(role)) {
            return true;
        }

        const request = context.switchToHttp().getRequest();

        const user = request.user;

        if (!user) {
            return false;
        }

        // 현재 유저의 권한이 데코레이터에 명시된 권한보다 높은지 체크
        return user.role <= role;
    }
}