import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Movie } from './entity/movie.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';

@Injectable()
export class MovieService {
  // private movies: Movie[] = [];
  // private idCounter = 3;

  // Movie entity를 InjectRepository를 통해서 movieRepository을 통해 접근가능하게함
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>
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

  async getManyMovies(title?: string) {
    if (!title) {
      return [await this.movieRepository.find(), await this.movieRepository.count()]
    }
    return this.movieRepository.findAndCount({
      where: {
        title: Like(`%${title}%`)
      }
    })
    // if (!title) {
    //   return this.movies;
    // }

    // //return this.movies.filter((m) => m.title === title);
    // return this.movies.filter((m) => m.title.startsWith(title));
  }

  async getMovieById(id: number) {
    // const movie = this.movies.find((m) => m.id === +id);
    const movie = await this.movieRepository.findOne({
      where: {
        id,
      }
    })

    // if (!movie) {
    //   throw new Error('존재하지 않는 ID');
    // }
    if (!movie) {
      throw new NotFoundException('존재하지 않는 ID');
    }

    return movie;
  }

  // createMovie(title: string, genre: string) {
  //   const movie: Movie = {
  //     id: this.idCounter++,
  //     title: title,
  //     genre: genre,
  //   };

  //   this.movies.push(movie);

  //   return movie;
  // }

  async createMovie(CreateMovieDto: CreateMovieDto) {
    // save를 해야 실제 객체가 생성된다
    const movie = await this.movieRepository.save(CreateMovieDto);
    
    return movie;
  }

  async updateMovie(id: number, UpdateMovieDto: UpdateMovieDto) {
    const movie = await this.movieRepository.findOne({
      where: {
        id,
      }
    })

    if (!movie) {
      throw new NotFoundException('존재하지 않는 ID');
    }

    await this.movieRepository.update(
      {id},
      UpdateMovieDto
    )

    const newMovie = await this.movieRepository.findOne({
      where: {
        id,
      }
    })

    return newMovie;
  }
 
  async deleteMovie(id: number) {
    const movie = await this.movieRepository.findOne({
      where: {
        id,
      }
    })

    if (!movie) {
      throw new NotFoundException('존재하지 않는 ID');
    }

    await this.movieRepository.delete(id);

    return id;
  }
}
