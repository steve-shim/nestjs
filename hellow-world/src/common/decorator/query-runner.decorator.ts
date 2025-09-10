import { createParamDecorator, ExecutionContext, InternalServerErrorException } from "@nestjs/common";


export const QueryRunner = createParamDecorator(
    (data: any, context: ExecutionContext) => {
        const request = context.switchToHttp().getRequest();

        /// queryRunner가 없는 경우는
        /// @UseInterceptors(TransactionInterceptor)를 적용 안했을때 뿐이므로 서버에러
        if(!request || !request.queryRunner) {
            throw new InternalServerErrorException('Query Runner 객체를 찾을 수 없습니다!')
        }

        return request.queryRunner;
    }
)