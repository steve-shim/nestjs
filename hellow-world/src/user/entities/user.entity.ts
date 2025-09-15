import { Exclude } from "class-transformer";
import { BaseTable } from "src/common/entity/base-table.entity";
import { MovieUserLike } from "src/movie/entity/movie-user-like.entity";
import { Movie } from "src/movie/entity/movie.entity";
import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

export enum Role {
    admin, // 0
    paidUser, // 1
    user // 2
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

    // 사용자 하나가 여러개의 영화를 만들수 있음
    @OneToMany(
        () => Movie,
        (movie) => movie.creator
    )
    createdMovies: Movie[];

    @OneToMany(
        () => MovieUserLike,
        (mul) => mul.user,
    )
    likedMovies: MovieUserLike[];
}
