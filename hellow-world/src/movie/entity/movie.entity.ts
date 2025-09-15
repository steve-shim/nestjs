import { Exclude, Expose, Transform } from 'class-transformer';
import { Column, CreateDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, TableInheritance, UpdateDateColumn, VersionColumn } from 'typeorm';
import { UpdateMovieDto } from '../dto/update-movie.dto';
import { BaseTable } from '../../common/entity/base-table.entity';
import { MovieDetail } from './movie-detail.entity';
import { Director } from 'src/director/entity/director.entity';
import { Genre } from 'src/genre/entities/genre.entity';
import { User } from 'src/user/entities/user.entity';
import { MovieUserLike } from './movie-user-like.entity';

/// ManyToOne : Director -> 감독은 여러개의 영화를 만들 수 있음
/// OneToOne : MovieDetail -> 영화는 하나의 상세 내용을 갖을 수 있음
/// ManyToMany : Genre -> 영화는 여러개의 장르를 갖을 수 있고 장르는 여러개의 영화에 속할 수 있음

// Entity를 달아야 테이블이 생성되고 
// app.module.ts의 entity에 등록해야함
// @Entity()를 달아야 테이블로 관리하는게 된다.
// 이 Entity는 후에 typeorm의 Repository로 접근 가능
@Entity()
export class Movie extends BaseTable {
  @PrimaryGeneratedColumn()
  //@Expose()
  id: number;

  // 영화를 만드는 사람은 하나
  // 영화 입장에서는 영화 여러개당 하나의 사용자에게 귀속
  @ManyToOne(
    () => User,
    (user) => user.createdMovies,
  )
  creator: User;

  @Column({
    unique: true
  })
  //@Expose()
  title: string;

  // @Column()
  // //@Expose()
  // genre: string;
  @ManyToMany(
    () => Genre,
    genre => genre.movies
  )
  @JoinTable()
  genres: Genre[];

  @Column({
    default: 0,
  })
  likeCount: number;

  @OneToOne(
    () => MovieDetail,
    movieDetail => movieDetail.id,
    {
      // Movie와 관련된 MovieDetail도 함께 만들어줘라
      cascade: true,
      nullable: false
    }
  )
  // OneToOne에서는 어떤쪽에서 소유를 해야하는지 모르기 때문에 한쪽에 JoinColumn해줘야 한다
  // detailId가 생성된다
  @JoinColumn()
  detail: MovieDetail;

  @Column()
  @Transform(({value}) => `http://localhost:3000/${value}`)
  movieFilePath: string;

  // 여러개의 영화가 하나의 감독을 가질수 있음
  // directorId가 생성된다
  @ManyToOne(
    () => Director,
    director => director.id,
    { 
      cascade: true,
      nullable: false
    }
  )
  director: Director

  @OneToMany(
    () => MovieUserLike,
    (mul) => mul.movie,
  )
  likedUsers: MovieUserLike[]
}
