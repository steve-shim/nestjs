import { Injectable, NotFoundException } from '@nestjs/common';
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
    private readonly dataSource: DataSource,
    private readonly commonService: CommonService,
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

  async findAll(dto: GetMoviesDto) {
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

    const [data, count] = await qb.getManyAndCount()

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
}
