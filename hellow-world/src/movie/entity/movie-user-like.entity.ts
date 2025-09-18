import { Column, Entity, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import { Movie } from "./movie.entity";
import { User } from "src/user/entities/user.entity";


@Entity()
export class MovieUserLike {

    // 합성 Primary KEY
    @PrimaryColumn({
        name: 'movieId',
        type: 'int8'
    })
    @ManyToOne(
        () => Movie,
        (movie) => movie.likedUsers,
        {
            onDelete: 'CASCADE',
        }
    )
    movie: Movie;
    
    // 합성 Primary KEY
    @PrimaryColumn({
        name: 'userId',
        type: 'int8'
    })
    @ManyToOne(
        () => User,
        (user) => user.likedMovies,
        {
            onDelete: 'CASCADE',
        }
    )
    user: User;

    @Column()
    isLike: boolean;
}