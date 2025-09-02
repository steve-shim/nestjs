import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Movie } from './entity/movie.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Like, Repository } from 'typeorm';
import { MovieDetail } from './entity/movie-detail.entity';
import { Director } from 'src/director/entity/director.entity';
import { Genre } from 'src/genre/entities/genre.entity';

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

  async findAll(title?: string) {
    const qb = await this.movieRepository.createQueryBuilder('movie')
      .leftJoinAndSelect('movie.director', 'director')
      .leftJoinAndSelect('movie.genres', 'genres');

    if(title) {
      qb.where('movie.title LIKE :title', {title: `%${title}%`})
    }

    return await qb.getManyAndCount();

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

  async create(CreateMovieDto: CreateMovieDto) {
    const director = await this.directorRepository.findOne({
      where: {
        id: CreateMovieDto.directorId
      }
    })

    if(!director) {
      throw new NotFoundException('존재하지 않는 ID의 감독입니다.')
    }

    const genres = await this.genreRepository.find({
      where: {
        id: In(CreateMovieDto.genreIds)
      }
    })

    if(genres.length !== CreateMovieDto.genreIds.length) {
      throw new NotFoundException(`존재하지 않는 장르가 있습니다. 존재하는 ids -> ${genres.map((genre) => genre.id).join(',')}`)
    }
    
    const movieDetail = await this.movieDetailRepository.createQueryBuilder()
      .insert()
      .into(MovieDetail)
      .values({
        detail: CreateMovieDto.detail,
      })
      .execute();

    // 생성한 값의 id 가져오기
    const movieDetailId = movieDetail.identifiers[0].id;

    const movie = await this.movieRepository.createQueryBuilder()
      .insert()
      .into(Movie)
      .values({
        title: CreateMovieDto.title,
        detail: {
          id: movieDetailId
        },
        director
      })
      .execute()

    const movieId = movie.identifiers[0].id;

    await this.movieRepository.createQueryBuilder()
      .relation(Movie, 'genres')
      .of(movieId)
      .add(genres.map(genre => genre.id))

    // // save를 해야 실제 객체가 생성된다
    // const movie = await this.movieRepository.save({
    //   title: CreateMovieDto.title,
    //   //detail: movieDetail,
    //   // movie.entity에서 cascade:true 옵션을 추가해주면 위에 
    //   // 디테일레포지토리에 따로 저장안하고 한번에 저장 가능하다
    //   detail: {
    //     detail: CreateMovieDto.detail
    //   },
    //   director,
    //   genres
    // });
    
    return await this.movieRepository.findOne({
      where: {
        id: movieId,
      },
      relations: ['detail', 'director', 'genres']
    });
  }

  async update(id: number, UpdateMovieDto: UpdateMovieDto) {
    const movie = await this.movieRepository.findOne({
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
      const director = await this.directorRepository.findOne({
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
      const genres = await this.genreRepository.find({
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

    await this.movieRepository.createQueryBuilder()
      .update(Movie)
      .set(movieUpdateFields)
      .where('id = :id', {id})
      .execute()

    // await this.movieRepository.update(
    //   {id},
    //   //movieRest
    //   movieUpdateFields
    // );

    if(detail) {
      await this.movieDetailRepository.createQueryBuilder()
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
      await this.movieRepository.createQueryBuilder()
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
    return this.movieRepository.findOne({
      where: {
        id,
      },
      relations: ['detail', 'director', 'genres']
    })
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
