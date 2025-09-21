import { BadRequestException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Movie } from './entity/movie.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Like, QueryRunner, Repository } from 'typeorm';
import { MovieDetail } from './entity/movie-detail.entity';
import { Director } from 'src/director/entity/director.entity';
import { Genre } from 'src/genre/entities/genre.entity';
import { GetMoviesDto } from './dto/get-movies.dto';
import { CommonService } from 'src/common/common.service';
import { join } from 'path';
import { rename } from 'fs/promises';
import { User } from 'src/user/entities/user.entity';
import { MovieUserLike } from './entity/movie-user-like.entity';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';

@Injectable()
export class MovieService {
  // private movies: Movie[] = [];
  // private idCounter = 3;

  // Movie entity를 InjectRepository를 통해서 movieRepository을 통해 접근가능하게함
  // constructor에 Repository로 Inject하려면 movie.module.ts에서 imports 해줘야한다
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    @InjectRepository(MovieDetail)
    private readonly movieDetailRepository: Repository<MovieDetail>,
    @InjectRepository(Director)
    private readonly directorRepository: Repository<Director>,
    @InjectRepository(Genre)
    private readonly genreRepository: Repository<Genre>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(MovieUserLike)
    private readonly movieUserLikeRepository: Repository<MovieUserLike>,
    private readonly dataSource: DataSource,
    private readonly commonService: CommonService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache
  ) {
    // const movie1 = new Movie();

    // movie1.id = 1;
    // movie1.title = '해리포터';
    // movie1.genre = 'fantasy';

    // const movie2 = new Movie();

    // movie2.id = 2;
    // movie2.title = '반지의 제왕';
    // movie2.genre = 'action';

    // this.movies.push(movie1, movie2);
  }

  async findRecent() {
    const cacheData = await this.cacheManager.get('MOVIE_RECENT');

    if(cacheData) { 
      console.log("캐시 가져옴!")
      return cacheData;
    }

    // 캐시에 데이터가 없을때만 서버가 데이터베이스로 요청을 보낸다.
    const data = this.movieRepository.find({
      order: {
        createdAt: 'DESC',
      },
      take: 2,
    })

    // 2초이내 재요청이 없는 경우 메모리에서 삭제한다. 
    // 모듈에서 설정한 TTL을 서비스에서 설정한 TTL이 OverWrite 한다.
    await this.cacheManager.set('MOVIE_RECENT', data, 2000);

    return data
  }

  async findAll(dto: GetMoviesDto, userId?: number) {
    //const {title, take, page} = dto;
    const {title} = dto;

    const qb = await this.movieRepository.createQueryBuilder('movie')
      .leftJoinAndSelect('movie.director', 'director')
      .leftJoinAndSelect('movie.genres', 'genres');

    if(title) {
      qb.where('movie.title LIKE :title', {title: `%${title}%`})
    }

    //this.commonService.applyPagePaginationParamsToQb(qb, dto)
    const {nextCursor} = await this.commonService.applyCursorPaginationParamsToQb(qb, dto) 

    let [data, count] = await qb.getManyAndCount()

    // 로그인된 사용자일때만 자신이 누른 좋아요 정보까지 함께 전달 받는다
    if(userId) {
      const movieIds = data.map(movie => movie.id);

      const likedMovies = movieIds.length < 1 ? [] : await this.movieUserLikeRepository.createQueryBuilder('mul')
        .leftJoinAndSelect('mul.user', 'user')
        .leftJoinAndSelect('mul.movie', 'movie')
        .where('movie.id IN(:...movieIds)', {movieIds})
        .andWhere('user.id = :userId', {userId})
        .getMany();
      
      /**
       * {
       *  movieId: boolean
       * } 
       */
      const likedMovieMap = likedMovies.reduce((acc, next) => ({
        ...acc,
        [next.movie.id]: next.isLike,
      }), {})

      data = data.map((x) => ({
        ...x,
        /// null || true || false
        likeStatus: x.id in likedMovieMap ? likedMovieMap[x.id] : null
      }))    
    }

    return {
      data,
      nextCursor,
      count
    }

    // if (!title) {
    //   return [await this.movieRepository.find({
    //     relations: ['director', 'genres']
    //   }), await this.movieRepository.count()]
    // }
    // return this.movieRepository.findAndCount({
    //   where: {
    //     title: Like(`%${title}%`)
    //   },
    //   relations: ['director', 'genres']
    // })
  }

  async findOne(id: number) {
    const movie = await this.movieRepository.createQueryBuilder('movie')
      .leftJoinAndSelect('movie.director', 'director')
      .leftJoinAndSelect('movie.genres', 'genres')
      .leftJoinAndSelect('movie.detail', 'detail')
      .leftJoinAndSelect('movie.creator', 'creator')
      .where('movie.id = :id', {id})
      .getOne();

    // const movie = await this.movieRepository.findOne({
    //   where: {
    //     id, 
    //   },
    //   relations: ['detail', 'director', 'genres']
    // })

    if (!movie) {
      throw new NotFoundException('존재하지 않는 ID');
    }

    return movie;
  }

  async create(CreateMovieDto: CreateMovieDto, userId: number, qr: QueryRunner) {
    // 트랜잭션 적용

    const director = await qr.manager.findOne(Director, {
      where: {
        id: CreateMovieDto.directorId
      }
    })

    if(!director) {
      throw new NotFoundException('존재하지 않는 ID의 감독입니다.')
    }

    const genres = await qr.manager.find(Genre, {
      where: {
        id: In(CreateMovieDto.genreIds)
      }
    })

    if(genres.length !== CreateMovieDto.genreIds.length) {
      throw new NotFoundException(`존재하지 않는 장르가 있습니다. 존재하는 ids -> ${genres.map((genre) => genre.id).join(',')}`)
    }
    
    // this.movieDetailRepository -> qr.manager
    // qr.manager 로 같은 트랜잭션 안에서 실행한 모든 쿼리들은 전부 롤백된다
    const movieDetail = await qr.manager.createQueryBuilder()
      .insert()
      .into(MovieDetail)
      .values({
        detail: CreateMovieDto.detail,
      })
      .execute();

    //throw new NotFoundException('일부러 에러 던짐')

    // 생성한 값의 id 가져오기
    const movieDetailId = movieDetail.identifiers[0].id;

    const movieFolder = join('public', 'movie');
    const tempFolder = join('public', 'temp');


    const movie = await qr.manager.createQueryBuilder()
      .insert()
      .into(Movie)
      .values({
        title: CreateMovieDto.title,
        detail: {
          id: movieDetailId
        },
        director,
        creator: {
          id: userId,
        },

        movieFilePath: join(movieFolder, CreateMovieDto.movieFileName)
      })
      .execute()

    const movieId = movie.identifiers[0].id;

    await qr.manager.createQueryBuilder()
      .relation(Movie, 'genres')
      .of(movieId)
      .add(genres.map(genre => genre.id))

    await rename(
      join(process.cwd(), tempFolder, CreateMovieDto.movieFileName),
      join(process.cwd(), movieFolder, CreateMovieDto.movieFileName)
    )

    // commit을 안하면 qr(트랜잭션)에서 작업한 내용들이 실제 데이터베이스에서는 적용이 안된다.
    return await qr.manager.findOne(Movie, {
      where: {
        id: movieId,
      },
      relations: ['detail', 'director', 'genres']
    });
  }

  async update(id: number, UpdateMovieDto: UpdateMovieDto) {
    // 트랜잭션 적용
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      // qr.manager로 변경
      const movie = await qr.manager.findOne(Movie, {
        where: {
          id,
        },
        relations: ['detail', 'genres']
      })

      if (!movie) {
        throw new NotFoundException('존재하지 않는 ID');
      }

      const { detail, directorId, genreIds, ...movieRest } = UpdateMovieDto;

      let newDirector;

      if(directorId) {
        const director = await qr.manager.findOne(Director, {
          where: {
            id: directorId,
          }
        });

        if(!director){
          throw new NotFoundException('존재하지 않는 ID의 감독입니다.')
        }

        newDirector = director;
      }

      let newGenres;

      if(genreIds) {
        const genres = await qr.manager.find(Genre, {
          where: {
            id: In(genreIds)
          }
        })

        if(genres.length !== UpdateMovieDto.genreIds.length) {
          throw new NotFoundException(`존재하지 않는 장르가 있습니다! 존재하는 ids -> ${genres.map(genre => genre.id).join(',')}`)
        }

        newGenres = genres
      }

      const movieUpdateFields = {
        ...movieRest,
        ...(newDirector && {director: newDirector})
      }

      await qr.manager.createQueryBuilder()
        .update(Movie)
        .set(movieUpdateFields)
        .where('id = :id', {id})
        .execute()

      //throw new NotFoundException('에러 일부러 던짐!')

      // await this.movieRepository.update(
      //   {id},
      //   //movieRest
      //   movieUpdateFields
      // );

      if(detail) {
        await qr.manager.createQueryBuilder()
          .update(MovieDetail)
          .set({
            detail,
          })
          .where('id = :id', {id: movie.detail.id})
          .execute();

        // await this.movieDetailRepository.update(
        //   {
        //     id: movie.detail.id
        //   },
        //   {
        //     detail,
        //   }
        // )
      }

      if(newGenres) {
        await qr.manager.createQueryBuilder()
          .relation(Movie, 'genres')
          .of(id)
          .addAndRemove(newGenres.map(genre => genre.id), movie.genres.map(genre => genre.id));
      }
      // const newMovie = await this.movieRepository.findOne({
      //   where: {
      //     id,
      //   },
      //   relations: ['detail', 'director']
      // })

      // newMovie.genres = newGenres;

      // await this.movieRepository.save(newMovie);

      // return newMovie;
      await qr.commitTransaction();
      return this.movieRepository.findOne({
        where: {
          id,
        },
        relations: ['detail', 'director', 'genres']
      })
    }catch(e){
      await qr.rollbackTransaction();

      throw e;
    }finally{
      await qr.release();
    }
  }
 
  async remove(id: number) {
    const movie = await this.movieRepository.findOne({
      where: {
        id,
      },
      relations: ['detail']
    })

    if (!movie) {
      throw new NotFoundException('존재하지 않는 ID');
    }

    await this.movieRepository.createQueryBuilder()
      .delete()
      .where('id = :id', {id})
      .execute();

    //await this.movieRepository.delete(id);
    await this.movieDetailRepository.delete(movie.detail.id);

    return id;
  }

  async toggleMovieLike(movieId: number, userId: number, isLike: boolean) {
    const movie = await this.movieRepository.findOne({
      where: {
        id: movieId,
      }
    })

    if(!movie) {
      throw new BadRequestException('존재하지 않는 영화입니다!');
    }

    const user = await this.userRepository.findOne({
      where: {
        id: userId,
      }
    })

    if(!user) {
      throw new UnauthorizedException('사용자 정보가 없습니다!')
    }

    const likeRecord = await this.movieUserLikeRepository.createQueryBuilder('mul')
      .leftJoinAndSelect('mul.movie', 'movie')
      .leftJoinAndSelect('mul.user', 'user')
      .where('movie.id = :movieId', {movieId})
      .andWhere('user.id = :userId', {userId})
      .getOne();

    if(likeRecord) {
      if(isLike === likeRecord.isLike) {
        await this.movieUserLikeRepository.delete({
          movie,
          user,
        })
      } else {
        await this.movieUserLikeRepository.update({
          movie,
          user,
        }, {
          isLike,
        })
      }
    } else {
      await this.movieUserLikeRepository.save({
        movie,
        user,
        isLike,
      })
    }

    const result = await this.movieUserLikeRepository.createQueryBuilder('mul')
      .leftJoinAndSelect('mul.movie', 'movie')
      .leftJoinAndSelect('mul.user', 'user')
      .where('movie.id = :movieId', {movieId})
      .andWhere('user.id = :userId', {userId})
      .getOne();

    return {
      isLike: result && result.isLike,
    }
  }
}
