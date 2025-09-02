import { BaseTable } from "src/common/entity/base-table.entity";
import { Movie } from "src/movie/entity/movie.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Director extends BaseTable {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    dob: Date;

    @Column()
    nationality: string;

    // 하나의 감독이 여러개의 영화를 가질수 있음
    @OneToMany(
        () => Movie,
        movie => movie.director,
    )
    movies: Movie[];
}
