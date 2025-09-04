import { Exclude } from "class-transformer";
import { BaseTable } from "src/common/entity/base-table.entity";
import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

export enum Role {
    admin,
    paidUser,
    user
}

@Entity()
export class User extends BaseTable {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        unique: true,
    })
    email: string;

    @Column()
    @Exclude({
        //toClassOnly: false, // 요청을 받을때는 비밀번호 필요
        toPlainOnly: true, // 응답을 보낼때는 비밀번호 불필요
    })
    password: string;

    @Column({
        enum: Role,
        default: Role.user
    })
    role: Role;
}
